# Runtime OS 보안 게이트 (2026-10-26)

현재 운영 이미지에 대한 읽기 전용 점검에서 OS 패키지 취약점이 확인되어, 공식 NGINX stable `1.30.6-alpine3.24`의 검증된 digest를 고정했다. 빌드 시 `apk upgrade --no-cache`로 해당 Alpine 저장소의 최신 보안 패키지를 반영한다. digest는 기본 이미지의 식별자이며 최종 OS 패키지 집합은 빌드 시점 저장소 상태에 따라 달라진다. 최종 빌드 이미지는 Git SHA 라벨과 기존 immutable artifact로 식별한다.

[공식 NGINX 뉴스](https://nginx.org/)는 2026-10-14에 stable 1.30.6 보안 수정 릴리스를 공지했다. [공식 보안 권고](https://nginx.org/en/security_advisories.html)는 alias/rewrite 버퍼 오버플로, 변수 문자열 평가 버퍼 오버플로, HTTP/3 요청 본문 주입, TLS 세션 티켓 회전 시 세션 위조, AIO 사용 시 use-after-free 수정 경계를 1.30.6 이상으로 명시한다. 기능별 영향 조건은 다르므로 이 사이트에서 모든 취약점이 실제로 악용됐다는 의미는 아니다.

CI는 기존 static 참조·한글 경로·health·headers·공개 경계 검사를 유지한다. 실제 빌드한 이미지 ID를 Trivy 0.76.1로 OS 패키지 스캔한 뒤에만 기존 이미지 artifact를 만든다. 도구 archive SHA256은 `c7cbe3137fb8a48a17574bede3dd6beb16742d1e9772929940fc90082c39d9c0`으로 검증한다.

게이트는 저장소 ignore/config와 환경 설정을 격리하고 취약점 scanner만 실행한다. 텔레메트리를 끄고 모든 심각도를 수집한다. Alpine OS 인식 및 OS package inventory >0을 요구하며 CRITICAL/HIGH, scanner 오류, 보고서 오류, 미검사 상태에서 실패한다. LOW/MEDIUM/UNKNOWN도 수량을 표시하되 이 게이트의 차단 기준은 CRITICAL/HIGH다.

출력은 고정된 allowlist template의 OS 인식 여부·패키지 수·심각도 수량뿐이다. 이미지 config/env/target·원문 scanner/container 로그·원문 보고서는 출력하거나 업로드하지 않는다. 임시 scan 자료는 종료 시 제거하며 기존 이미지 배포 artifact만 유지한다.

정적 파일·NGINX 설정·8080 포트·read_only·볼륨 및 DB 없는 데모 정책은 그대로다. Docker daemon이 없는 로컬에서는 합성 게이트 회귀·정적 검사·Bash 문법 검사까지만 검증했으며, 실제 이미지 빌드/NGINX 회귀/새 OS 스캔 결과는 정확한 GitHub CI에서 확인해야 한다. 이는 전체 보안 결함 부재를 보증하는 검사가 아니다.
