# MOVD

소프트웨어 개발 외주 스튜디오 MOVD의 웹사이트입니다. 마케팅 페이지, 실시간
채팅, 문의, 상담 후 발급하는 커스텀 결제 링크(무통장입금), 용역계약서 온라인 서명,
관리자 대시보드(문의/주문/포트폴리오/채팅/장부/방문·이탈 분석)를 포함합니다.

## 기술 스택

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4. 등장·전환 애니메이션은 대부분 CSS(`globals.css @layer utilities`),
  일부 화면(admin·chat·payment)만 framer-motion.
- 본문 폰트 Pretendard 는 `public/fonts/pretendard/` 에 동적 서브셋(unicode-range 92청크)으로
  자체 호스팅. `src/styles/pretendard-subset.css` 를 layout 에서 import. next/font 로 되돌리지 말 것.
- PostgreSQL + Prisma 7 (드라이버 어댑터: `@prisma/adapter-pg`)
- 결제: 무통장입금(계좌이체)만. PG/결제대행사(포트원 등) 연동 없음 —
  고객이 입금 후 입금자명을 알리면 관리자가 실제 입금 내역을 직접 확인해 승인.
- 관리자 인증: `iron-session` 기반 경량 세션
- 이메일: Resend (선택)
- 레이트리밋: Upstash Redis (선택, 미설정 시 in-memory로 대체 — 로컬 개발용)

## 로컬 개발 준비

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수

`.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

- `DATABASE_URL`: PostgreSQL 접속 정보. 로컬은 Docker(`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`) 또는 [Neon](https://neon.tech)/[Supabase](https://supabase.com) 같은 무료 클라우드 Postgres를 사용하세요.
- `SESSION_SECRET`: `openssl rand -base64 32`로 생성한 32자 이상의 무작위 문자열.
- `FIELD_ENCRYPTION_KEY`: 채팅 내용·이름·연락처 암호화 키 (`openssl rand -base64 32`).
- `RESEND_API_KEY`, `ADMIN_NOTIFY_EMAIL`: 문의 접수 시 이메일 알림을 받으려면 설정하세요. 비워두면 알림 발송만 조용히 건너뜁니다.
- 입금 계좌 정보는 `.env`가 아니라 관리자 페이지(`/admin/settings`)에서 관리합니다.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: 프로덕션 배포 시 반드시 설정하세요(서버리스 다중 인스턴스에서는 in-memory 레이트리밋이 동작하지 않습니다).

### 3. 스키마 적용 및 관리자 계정 생성

```bash
npx prisma db push    # 스키마를 DB에 반영 (마이그레이션 히스토리를 쓰지 않습니다)
npm run db:seed       # 관리자 계정 생성 (기본: admin@overcook.kr / changeme123!)
```

이 프로젝트는 `prisma migrate` 대신 `prisma db push`를 씁니다 — `npm run build`도
`prisma db push && next build`로 되어 있어 배포 시 스키마가 자동 반영됩니다.

`.env`에 `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`를 지정하면 그 값으로 생성됩니다.
**최초 로그인 후 반드시 비밀번호를 변경하세요.**

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) — 공개 사이트
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) — 관리자

## 주요 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma 마이그레이션 생성/적용 |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `npm run db:seed` | 관리자 계정 시드 |

## 결제 플로우 요약

**상담 후 커스텀 결제** (`/admin/orders/new` → 결제 링크 발급 → `/pay/[orderToken]`):
외주 특성상 실제 계약은 상담 후 협의된 금액으로 관리자가 주문을 생성하고, 고객에게
전용 결제 링크를 전달합니다. 고정가 상품 즉시결제 경로는 없습니다.

무통장입금 확인은 `src/lib/payment-service.ts`를 거칩니다. 고객이 `/pay/[orderToken]`
에서 입금자명을 남기면 주문이 `PAYMENT_CLAIMED` 상태가 되고, 관리자가 실제 입금
내역을 확인한 뒤 `confirm-payment`로 승인합니다. 이때 거래 사실의 무결성 해시를
저장해, 거래확인서(`/pay/[orderToken]/confirmation`)에서 사후 변조 여부를 검증할 수
있습니다. 중복 클릭·중복 승인은 상태 기반 원자적 업데이트로 막습니다.

## 알아두어야 할 것 (실제 운영 전 필수)

- **사업자 정보**: `/admin/settings`에서 상호/대표자/사업자등록번호/통신판매업
  신고번호/주소/입금 계좌를 채워야 합니다 (전자상거래법상 필수 표기 사항).
  Footer와 `/terms`·`/privacy`·`/refund-policy`가 이 값을 읽어 표시합니다.
- **약관·개인정보·환불정책**: `/terms`, `src/lib/privacyPolicy.ts`,
  `src/lib/refundPolicy.ts`는 표준 템플릿입니다. 법률 검토 후 확정하세요.
- **콘텐츠**: `src/lib/content.ts`(서비스 소개, FAQ)는 샘플입니다. 포트폴리오·후기는
  `/admin`에서 DB로 관리합니다.
- **레이트리밋**: 프로덕션에는 Upstash Redis를 반드시 연결하세요.

## 배포 (VPS + nginx)

`npm run build` (= `prisma db push && next build`) 후 `npm run start`. 환경 변수는
`.env.example` 항목을 그대로 설정하고, 특히 `SITE_URL`을 실제 도메인으로.

**nginx 앞단에서 반드시:**

- `client_max_body_size 60m;` — 업로드 라우트가 본문을 메모리에 올리기 전에 헤더로
  거르지만, 위조·누락된 Content-Length의 최종 방어선입니다.
- `gzip on;` (가능하면 `brotli on;`) — JS/CSS/HTML. `.woff2`는 이미 압축본이라 제외.
- `X-Real-IP` 를 실제 접속 IP로 세팅 (`proxy_set_header X-Real-IP $remote_addr;`).
  계약서 서명 증거·레이트리밋이 이 값을 신뢰합니다.

**crontab** (`CRON_SECRET` 설정 후) — 시간은 **서버(UTC) 기준**. 리포트 창은 코드가 KST 로 계산하므로,
한국시간 자정에 보내려면 `15:00 UTC` 에 실행합니다(서버가 `Asia/Seoul` 이면 `0 0`).

```
0  15 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/daily-report
30 4  * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/sweep-uploads
```

```
20 3 * * *  /opt/pg-backup.sh >> /var/log/movd-backup.log 2>&1
```

- `daily-report` — 전날(KST) 방문 요약을 슬랙으로. 한국시간 00:00 발송.
- `pg-backup` — PostgreSQL 일일 덤프(`deploy/pg-backup.sh` → VPS `/opt/pg-backup.sh`).
  `/opt/backups/` 에 14일치 보관. `.env` 에 `R2_REMOTE="r2:버킷명"` + rclone 설정하면 R2 로도 업로드.
- `sweep-uploads` — `public/uploads` 에서 DB 미참조 고아 파일 정리(24h 유예).
  첫 실행은 `?dryRun=1` 로 확인.

PostgreSQL은 같은 VPS 또는 Neon/Supabase 등 관리형. 업로드 파일은 로컬 디스크
(`public/uploads`)에 저장되므로 VPS 재배포 시 볼륨을 유지해야 합니다.
