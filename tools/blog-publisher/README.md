# MOVD 블로그 퍼블리셔

`/admin/blog` 초안에서 **발행** 버튼을 누르면 앱에는 "대기열(QUEUED)"로만 올라갑니다.
실제 게시는 이 프로그램이 합니다 — 앱의 대기열을 당겨와 네이버 블로그·티스토리
**MCP 서버**로 글을 올리고, 결과 URL 을 앱에 돌려줍니다.

## 왜 로컬에서 돌려야 하나

- MCP 서버는 앱(movd.co.kr)이 직접 못 부릅니다. MCP 클라이언트가 필요해요.
- **네이버**는 데이터센터 IP(VPS·클라우드) 로그인을 캡차·2FA·계정잠금으로 막습니다.
  → 반드시 **가정용 인터넷에 물린 PC**(또는 그 집의 리눅스 미니PC/라즈베리파이)에서.
- **티스토리**는 서버에서도 대체로 됩니다. 네이버만 안 붙이면 VPS 도 가능.

**이 스크립트는 LLM 을 호출하지 않습니다.** MCP 서버(Playwright 브라우저 자동화)를
그냥 실행할 뿐이라 Claude/Gemini 사용량과 무관합니다. 초안 생성(Gemini)만 앱에서 별도.

## 설치

```bash
cd tools/blog-publisher
npm install
cp .env.example .env      # 값 채우기
```

### 네이버 블로그 MCP (space-cap/naver-blog-mcp)

```bash
git clone https://github.com/space-cap/naver-blog-mcp
cd naver-blog-mcp
uv sync
uv run playwright install chromium
# 이 repo 의 .env 에 네이버 ID/PW 입력 (README 참고)
```

`.env` 의 `NAVER_MCP_CMD` 를 clone 한 경로로 맞춥니다.

### 티스토리 MCP (tistory-mcp)

`npm install` 시 의존성으로 함께 설치됩니다(크로미움도 자동 다운로드).
`.env` 의 `TISTORY_BLOG_URL` 에 발행할 블로그 host 를 넣으세요 (예: `movdlog.tistory.com`).

첫 1회 카카오 로그인:

```bash
node index.mjs --tistory-login
```

크로미움 창이 뜨면 카카오 로그인(푸시/2FA)을 승인합니다. 쿠키가 Windows 자격증명
관리자에 저장돼 이후엔 재실행 불필요(만료 전까지). `tistory-login.bat` 더블클릭도 동일.

## 실행

```bash
npm start          # 5분마다 대기열 확인 (계속 실행)
npm run once       # 대기열 1회만 처리하고 종료 (스케줄러용)
```

### Windows 작업 스케줄러 (1일 1회 권장)

1. 작업 스케줄러 → 작업 만들기
2. 트리거: 매일 원하는 시각 1회
3. 동작: 프로그램 시작 →
   - 프로그램: `node`
   - 인수: `index.mjs --once`
   - 시작 위치: `...\tools\blog-publisher`
4. "가장 높은 권한으로 실행" 불필요. 로그인 계정으로.

## 로그 · 문제 해결

- 실행 로그: `tools/blog-publisher/run.log` (+ 콘솔)
- **"글 생성 툴을 찾지 못했습니다"** — MCP 서버 버전이 바뀌어 툴 이름이 다릅니다.
  로그에 찍힌 "사용 가능한 툴" 목록을 보고 `index.mjs` 의 `CREATE_TOOL_CANDIDATES` 에 추가.
- **네이버 로그인 실패/캡차** — 가정용 IP 인지, 해당 PC 브라우저에서 네이버에 한 번
  로그인해 둔 상태인지 확인. 자동화가 계속 막히면 네이버는 수동 발행으로 두세요.
- **URL 회수 실패** — 게시는 됐는데 주소를 못 읽은 경우. 앱에서 상태는 "발행됨"이지만
  링크가 비어 블로그에서 직접 확인하라는 메모가 남습니다.

## 리스크

네이버 블로그 자동 발행은 약관 위반 소지가 있어 저품질 처리·이용정지 가능성이
있습니다. 대표님이 감수하기로 한 부분입니다. 에디터 DOM 이 바뀌면 MCP 서버가
깨질 수 있고, 티스토리 MCP 는 커뮤니티 패키지라 검증되지 않았습니다.
