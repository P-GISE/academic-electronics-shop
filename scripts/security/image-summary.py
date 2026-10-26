# /// script
# requires-python = ">=3.12"
# ///
"""Gate only the allowlisted runtime scan summary; never echo scanner inputs."""
from dataclasses import dataclass
import json
from pathlib import Path
import sys
from typing import Final

SEVERITIES: Final = ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')

@dataclass(frozen=True, slots=True)
class Summary:
    known_os: bool
    packages: int
    counts: tuple[int, ...]

@dataclass(frozen=True, slots=True)
class InvalidSummary(Exception):
    def __str__(self) -> str:
        return 'invalid_allowlisted_summary'


def read_summary(path: Path) -> Summary:
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, dict) or set(data) != {'known_os', 'results'} or type(data['known_os']) is not bool or not isinstance(data['results'], list):
        raise InvalidSummary()
    counts = [0] * len(SEVERITIES)
    packages = 0
    for row in data['results']:
        if not isinstance(row, dict) or set(row) != {'os_packages', 'packages', 'severities'} or type(row['os_packages']) is not bool or type(row['packages']) is not int or row['packages'] < 0 or not isinstance(row['severities'], list):
            raise InvalidSummary()
        if row['os_packages']:
            packages += row['packages']
        for severity in row['severities']:
            if not isinstance(severity, str) or severity not in SEVERITIES:
                raise InvalidSummary()
            counts[SEVERITIES.index(severity)] += 1
    return Summary(data['known_os'], packages, tuple(counts))


def main() -> int:
    try:
        if len(sys.argv) != 3:
            raise InvalidSummary()
        scanner_status = int(sys.argv[2])
        summary = read_summary(Path(sys.argv[1]))
    except (InvalidSummary, OSError, UnicodeError, ValueError):
        print(json.dumps({'status': 'BLOCKED', 'reason': 'scanner_or_summary_incomplete'}))
        return 1
    passed = scanner_status == 0 and summary.known_os and summary.packages > 0 and summary.counts[3] == 0 and summary.counts[4] == 0
    print(json.dumps({'status': 'PASS' if passed else 'BLOCKED', 'scanner_completed': scanner_status == 0,
                      'known_os': summary.known_os, 'os_package_inventory': summary.packages,
                      'severity_counts': dict(zip(SEVERITIES, summary.counts, strict=True))}))
    return 0 if passed else 1

if __name__ == '__main__':
    raise SystemExit(main())
