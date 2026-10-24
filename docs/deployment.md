# 정적 데모 배포 준비

이 사이트는 학술제 발표용 HTML/CSS/JavaScript 데모다. 실제 회원 인증, 주문 저장, 결제, 문의 접수, DB는 없다. 기존 로그인·가입·결제 성공 메시지는 화면 시연일 뿐이다. 실제 개인정보를 입력하지 않는다. 폼 전송은 브라우저와 nginx CSP에서 차단한다.

## 패키지와 공개 경계

- nginx가 `/`에서 기존 `메인.html`을 UTF-8로 제공한다. 한글·공백·대소문자 파일명을 유지한다. SPA fallback은 없고 잘못된 경로는 404다.
- Docker에는 허용된 정적 HTML/CSS/JS/이미지와 nginx 설정만 복사한다. `.git`, `.env`, 문서, 테스트, 개인 설정은 포함하지 않는다. HTML·이미지 자체에 개인 자료를 새로 넣지 않는다.
- 제품 CSS/레이아웃을 유지했다. 원래 없던 `styles.css`, `css/styles.css`, `../images/hero_header.jpg` 참조만 제거했다. 백신이 삽입한 외부 스크립트와 문의 화면의 기존 개인 연락처도 제거했다.
- 장바구니 아이콘은 기존 Font Awesome 5.6.3 CDN(`use.fontawesome.com`)과 SRI를 유지한다. 외부 서버에 브라우저 IP가 전달될 수 있으며, 오프라인이면 아이콘이 표시되지 않을 수 있다. 다른 외부 스크립트/API 요청은 필요하지 않다.
- 기존 상품 사진과 로고의 공개 사용 권리는 확인되지 않았다. 운영 공개 전에 소유자가 출처·권리 및 이미지 안의 개인정보를 확인해야 한다. 이번 준비는 이미지 전체의 수동 검수를 의미하지 않는다.
- HTTP GET/HEAD만 제공하고 접근 로그는 끈다. 데이터 저장/volume, DB, 인증 비밀, 결제 키는 없다. 기존 서버·DNS·터널은 변경하지 않는다.

## 사전 조건 및 설정

Linux Docker Engine과 Docker Compose v2가 필요하다. 개발 PC의 Windows Docker CLI만으로는 Linux 이미지 검증이 되지 않는다. CI는 PR 및 `main`, `codex/deployment-prep-20261024` push에서 정적 검사와 실제 이미지 HTTP smoke만 수행하며 운영 배포는 하지 않는다.

`.env.example`을 `.env`로 복사하고 다음 두 값을 정한다. 누락하면 Compose가 시작 전에 실패한다.

| 키 | 목적 |
| --- | --- |
| `HTTP_PORT` | 승인된 미사용 loopback 포트. 예제 18085는 예약값이 아니다. |
| `IMAGE_TAG` | 검토된 Git commit SHA. 롤백을 위해 이전 이미지도 보존한다. |

서버용 비밀이나 브라우저 환경 변수는 없다. 기본 Compose network는 프로젝트 이름 `academic-electronics-shop`으로 분리된다. 같은 호스트에 추가 인스턴스를 설치할 때는 별도 프로젝트 이름과 포트를 지정한다.

## 설치와 검증 (승인된 대상에서만 실행)

```bash
cp .env.example .env
# .env의 HTTP_PORT와 IMAGE_TAG를 검토된 값으로 편집
python scripts/check_static.py
docker compose -f compose.production.yaml config --quiet
docker compose -f compose.production.yaml build --pull
docker compose -f compose.production.yaml up -d --wait
# .env에 선택한 실제 포트 사용
python scripts/check_static.py --base-url http://127.0.0.1:18085
docker compose -f compose.production.yaml ps
```

HTTP 검사는 루트 내용·UTF-8·CSP, 한글/공백/대소문자 포함 모든 참조 자산의 바이트 일치, `/healthz`, 비공개 파일 차단, POST 차단을 확인한다. 별도로 브라우저에서 메인→카테고리→상품→구매 화면과 장바구니를 시연한다. 이 검증을 실제 인증/결제 성공으로 해석하지 않는다.

공개 도메인·TLS·리버스 프록시·접근 정책은 별도 승인 후 기존 인프라 담당자가 적용한다. 컨테이너는 `127.0.0.1`에만 바인딩되며 직접 인터넷에 공개되지 않는다. 프록시에서도 민감한 URL 쿼리를 로그에 남기지 않도록 검토한다.

## 업데이트와 롤백

배포 전 현재 `.env`의 이미지 태그와 검토된 소스 commit을 기록하고 이전 이미지를 삭제하지 않는다. 새 commit에서 새 태그로 build 후 `up -d --wait`와 HTTP 검사를 실행한다. 실패하면 `.env`의 `IMAGE_TAG`를 보존한 이전 태그로 되돌리고 `docker compose -f compose.production.yaml up -d --no-build --wait`를 실행한다. HTTP 검사는 해당 이전 소스 checkout의 스크립트로 수행한다. 이미지가 없으면 이전 commit에서 재빌드해야 한다. DB/migration/seed/업로드 복구는 없다. 중지는 `docker compose -f compose.production.yaml down`이다.
