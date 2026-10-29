# Academic 이벤트 배포 준비

대상: `P-GISE/academic-electronics-shop`, `main`, `.github/workflows/ci.yml`의 `Static deployment checks` 성공 push run. `.github/workflows/deploy-event.yml`은 운영자 승인에 따라 main 수동 실행 또는 동일 저장소의 성공 main push workflow_run만 허용하도록 활성화 조건을 준비했다. 이 source 변경의 원격 반영과 GitHub 이벤트 E2E는 아직 완료되지 않았다. release CI에는 Python setup 직후 이벤트 회귀 테스트 한 step을 추가한다. 기존 보안 gate, 이미지 검증, 앱, DB는 유지한다. 검토 대상은 workflow 2개와 이 문서, 직접 테스트 총 4파일이다.

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

## 전환 순서와 검증 한계

2026-10-29 운영자 확인: v1 접근 원복 후 v2 제한키와 root 소유 wrapper `/usr/local/bin/academic-ssh-entry` 설치, 임의 `uname` 명령 exit 64 거절, 현재 배포 SHA `a654db90ee8cbb494bfb48f3469920b822dc0794`와 run `40332944625`에 대한 실제 image/health verified 확인, secret 3개 등록 완료. 이 결과는 운영자 확인이며 아래 로컬 mock 테스트와 구분한다. GitHub workflow 실행 E2E는 미완료이며 timer는 유지한다. 과거 준비·실패 이력은 infra `.omo/evidence/event-deploy-20261029/`의 `shop-repo-preparation.md`와 `current-findings.md`에 보존한다. 실제 성공, 실패, 중복, lock 재시도, 수동 복구 및 실제 SHA/run/health를 확인한 뒤 **이 프로젝트 timer만** 해제한다. 그 전까지 timer를 유지한다.

로컬 검증: `python -m unittest discover -s scripts/deploy -p test_event_workflow.py -v`. 실제 workflow inline Python을 mock API/SSH로 실행하여 canonical 조회/불일치, 수동 복구, 잘못된 영수증, retry 경계와 SSH 옵션을 검사한다. 12개 로컬 테스트는 실제 job 조건식의 성공/거절 계약과 canonical API 신뢰 경계도 검사한다. 이 테스트 자체는 실서버 SSH, GitHub Actions queue 지원, forced-command 설치, 실제 health/E2E를 검증하지 않는다. 기존 infra prototype의 35개 테스트는 별도 서버 어댑터 증거이며 저장소 테스트 수에 합산하지 않는다.

첫 이벤트 workflow commit은 `.github/workflows/deploy-event.yml` 신규 및 `.github/workflows/ci.yml`의 테스트 step 추가라는 보호 경로 변경을 포함한다. 최초 앱 승격 전에 운영자가 기존 배포 SHA와 새 commit의 보호 tree 차이를 정확히 검토하고 이 변경만 allowlist로 승인해야 한다. 기존 804 helper의 보호 가드는 유지한다. 가드를 제거하거나 모든 보호 경로 변경을 포괄 허용해서는 안 된다.
