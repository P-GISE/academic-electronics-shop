# Academic 이벤트 배포

대상은 `P-GISE/academic-electronics-shop`의 `main`, `.github/workflows/ci.yml`의 `Static deployment checks` 성공 push run이다. 이벤트 workflow와 회귀 테스트는 main에 반영됐다. 초기 보호 경로 승격과 [GitHub 수동 실행 #40817734848](https://github.com/P-GISE/academic-electronics-shop/actions/runs/40817734848)의 실제 성공을 확인한 뒤 이 사이트 배포 timer만 해제했다. 백업은 유지한다. **timer 없는 후속 PR의 자동 신규 배포는 아직 검증 전**이다.

job 사전 조건은 outer 저장소, event/branch/status/conclusion/head_repository만 사용한다. payload의 중복 repository/path 필드에는 조기 skip을 걸지 않는다. 정확 repository/path는 canonical REST 응답에서 반드시 검증한다.

`workflow_run: completed`와 수동 복구 `workflow_dispatch` 모두 GitHub API에서 지정 run을 다시 조회한다. 저장소와 head 저장소, push/main, 정확 workflow 경로, 완료/성공, SHA와 숫자 run ID를 검증한다. 수동 실행은 main ref에서만 가능하며 정확 run ID와 40자리 SHA를 입력한다. 특권 job은 저장소 코드를 checkout하거나 실행하지 않는다.

## SSH 계약

운영자가 아래 secret 3개를 GitHub에 등록했다. 저장소에는 이름만 포함하며 값이나 키를 기록하지 않는다.

- `ACADEMIC_DEPLOY_SSH_KEY`: 이 프로젝트 전용 restricted SSH 개인키.
- `ACADEMIC_DEPLOY_KNOWN_HOSTS`: 운영자가 별도 확인한 정확 host key. 실행 중 ssh-keyscan으로 신뢰를 만들지 않는다.
- `ACADEMIC_DEPLOY_TARGET`: 고정 계정과 호스트 (`account@host`).

키와 known_hosts는 umask 077의 임시 디렉터리에 mode 0600으로 기록하고 EXIT trap으로 삭제한다. StrictHostKeyChecking, IdentitiesOnly, BatchMode를 강제한다. 키 값은 명령행 인자에 넣지 않는다. 서버 authorized_keys에는 프로젝트 고정 forced command와 `restrict`를 사용하고 shell, PTY, 포워딩을 허용하지 않는다. 원격 계약은 `event-deploy-academic SHA RUN_ID`뿐이다. 서버 진입점은 root 소유 고정 경로의 검토된 파일을 실행하고 GitHub run/현재 main HEAD/아티팩트를 독립 검증해야 한다. 저장소 Python을 root로 실행하지 않는다.

## 성공과 재시도

동일 프로젝트 concurrency는 `queue: max`, `cancel-in-progress: false`다. SSH exit 75와 stderr `event_deploy_failed:lock_timeout`이 정확히 일치할 때만 15초 간격, 20분 budget 안에서 재시도한다. 네트워크, 배포, 영수증 실패는 RED로 끝난다. 각 SSH 제한 20분, job 제한 40분이다. queue overflow나 budget 소진 시 정확 run ID/SHA로 수동 복구한다.

서버 exit 0만으로 성공하지 않는다. JSON 영수증의 verified/already_deployed 상태, 정확 SHA와 requested_run_id, 양수 deployed_run_id, 일치 artifact_run_id, image digest 형식을 검사한다. verified는 요청 run과 실제 배포 run이 일치해야 한다. already_deployed는 실제 설치 run provenance를 보존한다. 서버는 영수증 발급 전에 실제 실행 image의 OCI SHA와 health, 배포 state를 확인해야 한다. runner의 영수증 검사는 독립적인 HTTP health 확인을 대체하지 않는다.

## 운영 상태와 검증 한계

2026-10-29: `shop-aws` 전용 터널은 기존 hostname과 `127.0.0.1:3501` 원본을 유지한다. [PR #7](https://github.com/P-GISE/academic-electronics-shop/pull/7)의 초기 보호 경로 변경은 별도 검토 후 `7d2587ea976f3b2a7c72ee53ce15143fc640d245`로 승격됐다. 실제 image/health 및 독립 읽기 전용 21개 검사, 위 GitHub 수동 실행의 SHA/run/health 영수증을 확인했다. 배포 timer는 disabled/inactive, service는 inactive/최근 종료 0이며 다른 서비스와 백업 scheduling은 유지했다.

수동 실행 성공은 timer 해제 후 새 SHA가 자동 배포됐다는 증거가 아니다. 다음 문서 PR 병합 후 CI → workflow_run → 실제 새 SHA/image/health를 확인해야 한다. 실패는 RED와 원인으로 기록하고, 정확 run ID/SHA로 수동 복구한다. 과거 실패나 복구 이력은 운영 증거에서 보존하며 공개 문서에는 인증 재료·운영 설정 원문을 넣지 않는다.

로컬 검증은 `python -m unittest discover -s scripts/deploy -p test_event_workflow.py -v`다. 12개 테스트는 실제 조건식과 inline Python을 mock API/SSH로 실행한다. 실제 shell cleanup, GitHub queue나 서버 health를 이 mock 결과만으로 보장하지 않는다. 서버 어댑터 테스트와 운영자의 실제 확인은 별도 증거다.

`.github/`, `scripts/`, 배포 정의를 바꾸는 후속 변경은 정확 보호 tree delta의 운영자 검토가 필요하다. 기존 보호 가드는 유지한다. README와 docs만 바꾸는 이번 PR은 보호 정의를 변경하지 않는다.
