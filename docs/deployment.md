# 쇼핑몰 배포와 운영

공개 주소는 [shop.pigs0516.com](https://shop.pigs0516.com/)이다. HTML/CSS/JavaScript로 만든 학술제 정적 데모이며 회원 인증·주문 저장·결제·문의 접수·DB는 없다. 폼 전송은 브라우저와 nginx CSP에서 차단한다. 실제 개인정보를 입력하지 않는다.

## 현재 상태

2026-10-25 기준 앱 설치·Cloudflare 전용 주소 연결·자동배포 타이머 활성화를 확인했다. 공개 `/healthz`는 HTTPS 200이다. 최초 운영 배포 기준은 [`7a325ee`](https://github.com/P-GISE/academic-electronics-shop/commit/7a325eeaf168217d6e044daa7d6aade29275429e)이며, 이후 실제 실행 버전은 서버의 `deployed.json`과 컨테이너 이미지로 확인한다.

HTTP 접속은 같은 호스트·경로·쿼리를 보존해 HTTPS로 301 전환한다. 후속 GitHub 커밋의 자동 반영은 이 문서 작성 시점에 별도 검증 중이다. 타이머 활성화만으로 자동배포 전체 경로를 검증했다고 기록하지 않는다.

## 프로젝트 경계

| 항목 | 설정 |
|---|---|
| 소스·운영 브랜치 | `P-GISE/academic-electronics-shop`, `main` |
| 실행 위치 | 기존 AWS S2의 `/opt/academic-shop` |
| Compose 프로젝트·서비스 | `academic-electronics-shop` / `web` |
| 컨테이너 | `academic-electronics-shop-web-1` |
| 포트·상태 검사 | `127.0.0.1:3501` → 컨테이너 `8080`, `/healthz` |
| Cloudflare | `shop.pigs0516.com` → 기존 `factlens-ai` 터널 → `http://127.0.0.1:3501` |
| 네트워크·저장 | 프로젝트 전용 기본 bridge, DB·영속 볼륨 없음, nginx 임시 파일만 tmpfs |
| 설정 | `/opt/academic-shop/.env`, `compose.production.yaml`, `compose.image.yaml` |
| 배포 상태 | `/var/lib/five-sites-deploy/academic-shop/deployed.json` |
| 배포 설정·타이머 | `/etc/five-sites-deploy/academic-shop.json`, `five-sites-deploy@academic-shop.timer` |

`HTTP_PORT=3501`, `IMAGE_TAG=<최초 검토 SHA>`, `DEPLOY_IMAGE=sha256:<검증한 이미지 ID>`를 서버의 root 전용 `.env`에 둔다. 실제 실행 이미지는 `compose.image.yaml`의 `DEPLOY_IMAGE`가 결정한다. 자동 업데이트는 `IMAGE_TAG` 대신 `DEPLOY_IMAGE`와 배포 상태의 SHA를 갱신한다. 세 설정 파일은 root:root 0600으로 관리하며 Git에 운영 `.env`를 올리지 않는다.

프로젝트별 경로·컨테이너·네트워크는 분리되지만 AWS 서버, Docker daemon, Cloudflare 터널 프로세스는 다른 서비스와 공유한다. 서버 장애까지 격리된 구조는 아니다. 신규 유료 서버나 DB는 만들지 않았다.

## GitHub 업데이트가 반영되는 흐름

```text
main에 변경 병합
  → GitHub CI: 정적 참조·실제 nginx HTTP 검사
  → five-sites-app-<SHA> 이미지 아티팩트 게시
  → AWS 타이머가 성공한 동일 커밋을 확인
  → 이미지 검증 후 web 서비스만 교체
  → health·다른 컨테이너 보존 확인 또는 이전 이미지 복구
```

CI는 [ci.yml](../.github/workflows/ci.yml)에 정의돼 있다. HTML·로컬 자산의 경로와 바이트, UTF-8·CSP, 비공개 파일 접근과 POST 차단을 검사한 이미지 자체를 게시한다. 아티팩트에는 `image.tar.gz`, `image.sha256`, `revision.txt`만 담고 14일 보관한다. PR과 수동 실행의 성공은 운영 배포 대상이 아니다.

서버의 root 소유 `/usr/local/lib/five-sites-deploy/poll.py`가 기존 Ubuntu GitHub 인증으로 저장소·브랜치·push 이벤트·워크플로·현재 SHA·CI 성공을 확인한다. ZIP digest, 이미지 archive 체크섬, SHA 태그와 OCI revision을 검사한 뒤 불변 이미지 ID로 실행한다. 배포 직전 GitHub HEAD가 바뀌면 적용을 중단한다.

타이머는 부팅 약 3분 뒤부터 약 2분 간격에 최대 30초 지연을 더해 확인한다. CI와 다운로드·교체 시간도 필요하다. GitHub 업데이트마다 AWS 서버 전체를 재부팅하지 않는다. 배포기는 `web`만 `up -d --no-deps --no-build --pull never`로 교체하며 짧은 서비스 중단은 생길 수 있다. Tailscale과 외부에서 들어오는 배포 SSH는 필요하지 않다.

다음 변경은 자동 적용을 멈추고 운영 검토를 요구한다: `.github/`, `deploy/`, `scripts/`, DB·migration·schema·model·entity 경로, SQL, Dockerfile·`.dockerignore`, 이름에 `compose`가 포함된 파일 등 배포기가 보호하는 정의. 이 사이트에서는 특히 `deploy/nginx.conf` 변경도 해당한다. 일반 HTML/CSS/JS·이미지·문서 변경은 CI 통과 후 자동 적용 대상이다. 보호 경로 변경 시 검토된 서버 정의와 실행 이미지·배포 기준을 함께 갱신한다.

## 최초 설치와 상태 확인

최초 설치는 인프라 작업 공간에서 검토한 설치 번들로 수행했다. 설치기는 기존 경로·동일 프로젝트 자원·점유 포트가 있으면 중단하고, 성공한 운영 브랜치 CI 이미지와 검토된 Compose의 Git blob을 대조한다. 새 앱만 시작한 뒤 다른 컨테이너 ID·시작 시각·재시작 횟수·마운트가 유지됐는지 검사한다. 타이머는 앱 검증 후 별도로 활성화한다.

아래 명령은 운영 담당자의 상태 확인용이다. 사용자가 직접 서버 명령을 실행할 필요는 없다.

```sh
sudo systemctl is-enabled five-sites-deploy@academic-shop.timer
sudo systemctl is-active five-sites-deploy@academic-shop.timer
sudo systemctl status five-sites-deploy@academic-shop.service --no-pager
sudo cat /var/lib/five-sites-deploy/academic-shop/deployed.json
sudo docker inspect academic-electronics-shop-web-1 --format '{{.Image}} {{.State.Health.Status}}'
curl --fail http://127.0.0.1:3501/healthz
curl --fail https://shop.pigs0516.com/healthz
```

후속 커밋을 운영 브랜치에 병합한 뒤 CI 성공 → 서버 상태 SHA/이미지 변경 → 공개 화면·자산 → 다른 서비스 보존 순서로 확인한다. CI 성공이나 `/healthz` 200 하나만으로 상품·장바구니 흐름을 검증했다고 기록하지 않는다. 컨테이너 전체 inspect나 `.env` 원문을 공개 로그에 남기지 않는다.

## 실패와 롤백

검증 실패·CI 대기·보호 파일 변경은 실행 앱을 바꾸지 않는다. 앱 교체가 시작되면 `in-progress`와 `previous-environment`를 비공개 상태 디렉터리에 남긴다. 새 앱 health 또는 다른 컨테이너 보존 검사에 실패하면 이전 환경 파일·이미지·배포 상태를 복원하고 `in-progress`를 남겨 자동 재시도를 차단한다. 강제 종료 후에도 표식을 확인해 운영 복구를 요구한다.

수동 복구는 해당 타이머부터 중지한다.

```sh
sudo systemctl stop five-sites-deploy@academic-shop.timer
```

진행 중인 배포 서비스와 `in-progress`의 이전 SHA/이미지, `deployed.json`, `.env`, 실제 컨테이너를 대조한다. 이전 이미지가 로컬에 있고 `previous-environment`가 그 이미지와 일치할 때만 환경 파일을 root 0600으로 복원하고 두 Compose 파일을 사용해 `web`만 교체한다. 이전 버전 health·공개 화면·다른 컨테이너 보존을 확인한 뒤 배포 상태를 실제 SHA/이미지와 맞추고 실패 표식을 처리한다. 검증 전 표식을 지우거나 새 커밋으로 기준을 강제 갱신하지 않는다.

새 도메인 연결을 되돌릴 때는 `shop.pigs0516.com`의 DNS·터널 경로와 해당 호스트 전용 규칙만 대상이다. 기존 서비스의 DNS와 공유 터널 자체를 삭제하지 않는다. DB 복구는 없으며 이전 이미지는 복구가 끝날 때까지 보존한다.

## 기능·검증 한계

기존 상품 사진과 로고의 공개 사용 권리는 별도 확인 대상이다. 장바구니 아이콘은 Font Awesome CDN을 사용하므로 네트워크에 따라 표시되지 않을 수 있다. 로그인·가입·결제 화면은 시연 UI이고 실제 계정·주문·결제를 만들지 않는다. 브라우저에서 메인→카테고리→상품→구매 화면과 장바구니 계산을 별도로 확인한다.
