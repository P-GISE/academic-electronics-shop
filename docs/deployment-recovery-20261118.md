# 2026-11-18 CSP 배포 복구

PR #9의 main CI는 성공했지만 서버가 `schema_or_deployment_change_requires_review`로 배포를 차단했다. 공개 Actions의 `DeployError`만으로 원인을 추측하지 않고 서버의 기존 배포 SHA와 보호 파일 tree를 비교해 확인했다.

검토·승인 범위는 `b5a3ade6650f19135c41fc6401e01c17129abd3c`에서 `43c9cd45c266b57c06adfab24884d9da15de2869`로의 다음 변경뿐이다.

| 보호 파일 | 승인 내용 |
|---|---|
| `deploy/nginx.conf` | script-src의 unsafe-inline 제거 |
| `scripts/check_static.py` | 인라인 script·event·javascript URL 거부 검사 |
| `scripts/script-policy.test.cjs` | 외부 script·event 매핑 회귀 검사 추가 |
| `.github/workflows/ci.yml` | 위 script policy 검사 실행 추가 |

공유 `/usr/local/lib/five-sites-deploy/poll.py`는 변경하지 않았다. Academic 전용 `academic-poll.py`에 정확한 저장소·이전 SHA·목표 SHA와 4개 파일의 이전/이후 Git blob SHA가 모두 일치하는 경우만 승인했다. 다른 tree delta는 계속 차단한다. `/usr/local/libexec/academic-root-entry`는 전용 파일의 소유권·권한·device/inode·SHA-256을 검증한다. 원본 및 승인 hash 기록은 `/var/lib/five-sites-deploy/academic-shop/security-promotion-20261118`에 보존했다. 배포 state를 새 SHA로 미리 덮어쓰지 않았다.

[배포 44180993375](https://github.com/P-GISE/academic-electronics-shop/actions/runs/44180993375)의 재시도가 성공했다. 서버 영수증은 위 목표 SHA, CI run `44180804698`, 실행 image `sha256:a5a38f455ebf452735a164f4e7b8776d236bef440619e3cb715991de094797c4`와 일치한다. 원본과 공개 HTTPS에서 HTTP 200 및 `script-src 'self'`를 확인했다. 직전 이미지와 환경은 rollback용으로 유지한다.

이 승인은 다른 프로젝트나 이후 보호 파일 변경에 적용되지 않는다. 서버 배포기를 재설치할 때 전용 파일과 hash pin을 함께 유지해야 하며, 이후 보호 변경은 다시 검토한다. 공개 HTTP/CSP 검사는 전체 상품·장바구니 사용자 흐름 재검증을 대신하지 않는다.
