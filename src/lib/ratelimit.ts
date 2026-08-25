import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

// Upstash 환경 변수가 없는 로컬 개발 환경에서는 in-memory로 대체합니다.
// 주의: in-memory 방식은 서버리스 다중 인스턴스에서 동작하지 않으므로 프로덕션에는
// 반드시 UPSTASH_REDIS_REST_URL / TOKEN을 설정해 Redis 기반으로 전환해야 합니다.
const memoryStore = new Map<string, { count: number; resetAt: number }>();
const isProduction = process.env.NODE_ENV === "production";

function memoryLimit(key: string, limit: number, windowMs: number) {
  // 로컬 개발 환경(프록시가 없는 localhost)에는 x-forwarded-for가 없어 모든 요청이
  // 같은 identifier("unknown")로 잡혀 서로 다른 방문자/테스트 시도가 같은 카운터를
  // 공유하게 됩니다. 프로덕션(반드시 Upstash를 쓰는)에서는 절대 일어나지 않는
  // 상황이므로, 개발 환경에서만 제한을 건너뜁니다.
  if (!isProduction) {
    return { success: true };
  }

  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (entry.count >= limit) {
    return { success: false };
  }
  entry.count += 1;
  return { success: true };
}

const contactLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "rl:contact" })
  : null;

const loginLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), prefix: "rl:login" })
  : null;

const paymentAttemptLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), prefix: "rl:payment" })
  : null;

const chatMessageLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "5 m"), prefix: "rl:chat" })
  : null;

// 업로드는 텍스트 메시지보다 훨씬 무겁고(최대 50MB) 디스크에 그대로 쌓이므로,
// 훨씬 더 낮은 한도로 별도 제한합니다.
const chatUploadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), prefix: "rl:chat-upload" })
  : null;

// /api/track는 로그인 없이 누구나 호출 가능하고 호출마다 DB에 씁니다 — 정상적인
// 페이지 방문이라면 넉넉한 한도지만, 무제한으로 두면 테이블을 스팸으로 채울 수 있습니다.
const trackLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "5 m"), prefix: "rl:track" })
  : null;

const reviewSubmitLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "rl:review" })
  : null;

export async function limitContactSubmission(identifier: string) {
  if (contactLimiter) {
    const res = await contactLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`contact:${identifier}`, 5, 10 * 60 * 1000).success;
}

export async function limitLoginAttempt(identifier: string) {
  if (loginLimiter) {
    const res = await loginLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`login:${identifier}`, 10, 10 * 60 * 1000).success;
}

export async function limitPaymentAttempt(identifier: string) {
  if (paymentAttemptLimiter) {
    const res = await paymentAttemptLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`payment:${identifier}`, 10, 10 * 60 * 1000).success;
}

export async function limitChatMessage(identifier: string) {
  if (chatMessageLimiter) {
    const res = await chatMessageLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`chat:${identifier}`, 30, 5 * 60 * 1000).success;
}

export async function limitChatUpload(identifier: string) {
  if (chatUploadLimiter) {
    const res = await chatUploadLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`chat-upload:${identifier}`, 10, 10 * 60 * 1000).success;
}

export async function limitTrack(identifier: string) {
  if (trackLimiter) {
    const res = await trackLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`track:${identifier}`, 60, 5 * 60 * 1000).success;
}

export async function limitReviewSubmission(identifier: string) {
  if (reviewSubmitLimiter) {
    const res = await reviewSubmitLimiter.limit(identifier);
    return res.success;
  }
  return memoryLimit(`review:${identifier}`, 5, 10 * 60 * 1000).success;
}
