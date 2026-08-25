# 오버쿡 (Overcook)

소프트웨어 개발 외주 스튜디오 오버쿡의 웹사이트입니다. 마케팅 페이지, 실시간
채팅, 문의, 자체 상품 결제(포트원 연동), 상담 후 발급하는 커스텀 결제 링크,
관리자 대시보드(문의/주문/포트폴리오/채팅/방문·이탈 분석)를 포함합니다.

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + Framer Motion
- PostgreSQL + Prisma 7 (드라이버 어댑터: `@prisma/adapter-pg`)
- 결제: 포트원(PortOne) V2 (`@portone/browser-sdk`, `@portone/server-sdk`)
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
- `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`: 포트원 가맹점 가입 후 [관리자 콘솔 > 연동 정보](https://admin.portone.io/integration-v2/manage/channel)에서 발급받습니다. 가입 전에는 포트원 테스트 채널로 결제 플로우를 데모할 수 있습니다.
- `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`: 문의 접수 시 이메일 알림을 받으려면 설정하세요. 비워두면 알림 발송만 조용히 건너뜁니다.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: 프로덕션 배포 시 반드시 설정하세요(서버리스 다중 인스턴스에서는 in-memory 레이트리밋이 동작하지 않습니다).

### 3. 데이터베이스 마이그레이션 및 관리자 계정 생성

```bash
npm run db:migrate    # 최초 마이그레이션 생성 및 적용
npm run db:seed       # 관리자 계정 생성 (기본: admin@overcook.kr / changeme123!)
```

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

두 가지 결제 경로가 있습니다.

1. **자체 상품 즉시결제** (`/pricing` → `/checkout/[productId]` → `/pay/[token]`): 고정가 패키지를 고객이 바로 결제합니다. 상품/금액은 `src/lib/products.ts`가 유일한 소스입니다.
2. **상담 후 커스텀 결제** (`/admin/orders/new` → 결제 링크 발급 → `/pay/[token]`): 외주 특성상 대부분의 실제 계약은 상담 후 협의된 금액으로 관리자가 주문을 생성하고, 고객에게 전용 결제 링크를 전달하는 방식입니다.

두 경로 모두 `src/lib/payment-service.ts`의 동일한 `reconcilePayment()`를 거칩니다.
클라이언트가 보낸 결제 성공 신호는 트리거로만 쓰이고, 실제 승인 여부·금액은
항상 포트원 서버 API를 다시 조회해 확인한 뒤 원자적으로 DB 상태를 전환합니다.
포트원 웹훅이 최종 소스 오브 트루스로 동일 로직을 재확인합니다.

## 알아두어야 할 것 (실제 운영 전 필수)

- **사업자 정보**: `src/components/layout/Footer.tsx`와 `/terms`, `/privacy`,
  `/refund-policy` 페이지의 `[대표자명]`, `[000-00-00000]` 등 대괄호 placeholder를
  실제 상호/대표자/사업자등록번호/통신판매업신고번호/주소로 교체해야 합니다
  (전자상거래법상 필수 표기 사항).
- **포트원 가맹 심사**: 실제 결제를 받으려면 사업자 등록 후 포트원 가맹점
  심사를 통과해야 합니다. 승인 전에는 테스트 채널로만 결제 플로우를
  검증할 수 있습니다.
- **콘텐츠**: `src/lib/content.ts`(서비스/포트폴리오 소개), `src/lib/products.ts`
  (자체 상품 가격)는 전부 샘플 데이터입니다. 실제 내용으로 교체하세요.
- **CSP의 결제창 도메인**: `next.config.ts`의 CSP는 포트원 CDN/API 도메인만
  허용합니다. 실제 계약한 PG사가 같은 페이지 iframe으로 결제창을 띄우는
  방식이라면 해당 PG 도메인을 `frame-src`에 추가해야 합니다.
- **레이트리밋**: 프로덕션에는 Upstash Redis를 반드시 연결하세요.

## 배포

Vercel 배포를 기준으로 설계되었습니다(Next.js 네이티브 지원). PostgreSQL은
Vercel과 별개로 Neon/Supabase 등 관리형 서비스를 사용하는 것을 권장합니다.
환경 변수는 위 `.env.example`의 항목을 배포 환경에 동일하게 설정하세요.
