"""Check exact-case static references; optionally smoke-test a running image."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
EXTERNAL = "https://use.fontawesome.com/releases/v5.6.3/css/all.css"


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.urls.extend(attrs[key] for key in ("src", "href") if attrs.get(key))
        if tag == "form":
            assert attrs.get("onsubmit") == "return false;", "Demo form can submit data"


def check(base_url=None):
    files = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*")
             if p.is_file() and ".git" not in p.parts}
    referenced = {"메인.html"}
    pages = list(ROOT.glob("*.html"))
    for path in pages + list(ROOT.glob("*.css")) + list(ROOT.glob("*.js")):
        source = path.read_text(encoding="utf-8")
        parser = References()
        if path.suffix == ".html":
            parser.feed(source)
        urls = parser.urls + re.findall(r"url\(\s*['\"]?(.*?)['\"]?\s*\)", source)
        urls += re.findall(r"(?:window\.open\(|(?:window\.)?location\.href\s*=\s*)['\"]([^'\"]+)", source)
        for url in urls:
            parts = urlsplit(url)
            if parts.scheme or parts.netloc:
                assert url == EXTERNAL or parts.scheme == "javascript", f"Unexpected external URL in {path.name}"
                continue
            if not parts.path:
                continue
            target = unquote(parts.path).removeprefix("./").removeprefix("/")
            assert target in files, f"Missing exact-case asset: {path.name}: {target}"
            referenced.add(target)
    print(f"PASS static: {len(pages)} HTML pages, {len(referenced)} local targets; all demo forms block submit")
    if base_url:
        for target in sorted(referenced):
            with urlopen(base_url.rstrip("/") + "/" + quote(target), timeout=10) as response:
                assert response.status == 200
                assert response.read() == (ROOT / target).read_bytes(), target
        with urlopen(base_url + "/", timeout=10) as response:
            assert response.read() == (ROOT / "메인.html").read_bytes()
            assert "charset=utf-8" in response.headers["Content-Type"]
            assert "form-action 'none'" in response.headers["Content-Security-Policy"]
        with urlopen(base_url + "/healthz", timeout=10) as response:
            assert response.read() == b"ok\n"
        for target in ("/.env", "/.git/config", "/README.md", "/Dockerfile", "/docs/deployment.md", "/missing.html"):
            try:
                urlopen(base_url + target, timeout=10)
            except HTTPError as error:
                assert error.code in (403, 404), (target, error.code)
            else:
                raise AssertionError(f"Unexpected public file: {target}")
        try:
            urlopen(Request(base_url + "/", data=b"synthetic=only"), timeout=10)
        except HTTPError as error:
            assert error.code == 403
        else:
            raise AssertionError("POST unexpectedly allowed")
        print(f"PASS HTTP: {len(referenced)} local targets match bytes; UTF-8 root, health, private paths, POST")


if __name__ == "__main__":
    arguments = argparse.ArgumentParser()
    arguments.add_argument("--base-url")
    check(arguments.parse_args().base_url)
