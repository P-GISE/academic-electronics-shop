# 쇼핑몰 배포와 운영

공개 주소는 [shop.pigs0516.com](https://shop.pigs0516.com/)이다. HTML/CSS/JavaScript 학술제 정적 데모이며 회원 인증·주문 저장·결제·문의 접수·DB는 없다. 폼 전송은 브라우저와 nginx CSP에서 차단한다.

## 현재 구성과 확인 범위

2026-10-29 기준 `shop-aws` 전용 Cloudflare 터널과 nginx 컨테이너를 사용한다. 공개 hostname과 원본 `http://127.0.0.1:3501`은 유지했다. 컨테이너 포트는 8080이며 상태 경로는 `/healthz`다. 앱 전용 컨테이너·네트워크를 사용하고 DB·영속 볼륨은 없다. AWS 호스트와 Docker daemon은 다른 서비스와 공유한다.

[PR #7](https://github.com/P-GISE/academic-electronics-shop/pull/7)의 보호 경로 변경을 별도 검토한 뒤 [`7d2587e`](https://github.com/P-GISE/academic-electronics-shop/commit/7d2587ea976f3b2a7c72ee53ce15143fc640d245)를 초기 승격했다. 실제 SHA·이미지·health와 독립 읽기 전용 21개 검사를 확인했다. 이어 정확 CI run을 지정한 [GitHub 수동 이벤트 배포 #40817734848](https://github.com/P-GISE/academic-electronics-shop/actions/runs/40817734848)가 성공했고 동일 배포의 영수증을 확인했다.

그 뒤 이 사이트의 배포 polling timer만 disable 및 stop했다. timer는 disabled/inactive, 배포 service는 inactive/최근 종료 0이다. 다른 서비스와 별도 백업 작업은 변경하지 않았다. **timer 해제 후 새 PR이 자동으로 새 이미지를 배포하는 경로는 아직 검증 전**이다. 이 문서 PR은 실제 운영 설명을 갱신하는 변경이며 자동 배포 결과는 병합 후 관측해야 한다.

## GitHub 업데이트가 반영되는 흐름

```text
main에 PR 병합
  → Static deployment checks: 보안 gate·이벤트 회귀·정적/실제 이미지 검사
  → 같은 SHA의 불변 이미지 아티팩트 게시
  → 성공 workflow_run 이벤트
  → 전용 제한 SSH 명령으로 이 쇼핑몰만 배포
  → 실제 SHA·실행 이미지·health 영수증 확인
  → 실패 시 RED 및 필요한 이전 환경·이미지·상태 복구
```

[ci.yml](../.github/workflows/ci.yml)은 검증한 이미지 자체를 `five-sites-app-<SHA>`로 게시한다. ZIP digest, archive 체크섬, SHA 태그와 OCI revision을 서버에서 재검증한다. [deploy-event.yml](../.github/workflows/deploy-event.yml)은 canonical GitHub API로 저장소·push/main·정확 CI 경로·성공·run ID·SHA를 확인한다. 서버도 독립 재검증하며 현재 main HEAD와 다른 오래된 SHA는 거절한다. PR CI 성공만으로 배포하지 않는다.

배포는 이 앱의 web 서비스만 교체하며 서버 재부팅은 하지 않는다. 새 앱 health와 실제 이미지 revision, 배포 state를 확인한 뒤에만 성공 영수증을 반환한다. 실제 배포에는 짧은 중단이 생길 수 있다. SSH 인증 재료와 host key는 GitHub secret으로 관리하며 저장소·공개 로그에 값을 기록하지 않는다. 자세한 계약은 [이벤트 배포 안내](event-deployment.md)에 있다.

## 실패와 운영자 복구

CI 실패, canonical run 불일치, 오래된 SHA, 보호 경로 변경은 배포를 차단한다. 배포 중 health나 검증이 실패하면 기존 트랜잭션의 rollback으로 이전 환경·이미지·상태를 복원한다. rollback 검증까지 실패한 경우 복구 완료를 주장하지 않고 Actions가 RED로 끝난다. 실패 marker가 남으면 운영자가 실제 상태를 대조할 때까지 새 배포를 차단한다.

자동 재시도는 정확한 lock timeout만 제한된 budget 안에서 수행한다. 네트워크·아티팩트·health·영수증 오류는 성공으로 숨기거나 무조건 재시도하지 않는다. 운영자는 실제 SHA/이미지/health와 실패 원인을 확인하고, 복구한 뒤 main에서 `workflow_dispatch`에 **정확한 성공 CI run ID와 40자리 SHA**를 지정한다. 이전 이미지는 복구 검증이 끝날 때까지 보존한다. 실패 marker를 먼저 지우거나 새 기준으로 강제 덮어쓰지 않는다.

`.github/`, `deploy/`, `scripts/`, Dockerfile, Compose, DB 관련 경로 등 보호 정의 변경은 별도 검토가 필요하다. 기존 보호 가드를 제거하지 않는다. 이번 문서 변경은 README와 docs만 대상으로 하며 보호 정의를 바꾸지 않는다.

## 과거 timer 방식: 복구 참고

기존 polling timer는 현재 배포 경로가 아니며 disabled/inactive다. 장애 시 재활성화는 운영자가 이벤트 배포와의 중복 실행 여부와 원인을 검토한 뒤 별도로 결정한다. 이 문서의 복구 절차는 timer를 자동으로 다시 켜지 않는다. 백업 scheduling은 배포 timer와 별개로 유지한다. 도메인 복구 시에도 이 호스트의 DNS·전용 터널만 검토하고 다른 서비스의 경로를 변경하지 않는다.

## 기능·검증 한계

메인은 로고 이미지 링크와 저작권 문구를 가진 진입 화면이고 이미지 링크로 카테고리로 이동한다. 로그인·가입·결제는 시연 UI다. 브라우저 상품·장바구니 동작은 health 200이나 CI 성공만으로 검증되지 않는다. 상품 사진·로고 사용 권리는 별도 확인 대상이며 일부 아이콘은 외부 CDN에 의존한다. 후속 자동 신규 배포 완료는 실제 Actions 결과와 실행 SHA/이미지/health 확인 뒤에만 기록한다.
