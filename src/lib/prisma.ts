import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7부터 PrismaClient가 자체 엔진으로 직접 연결하지 않고, 드라이버 어댑터를
// 통해서만 DB에 연결합니다. (schema.prisma의 datasource.url은 CLI/마이그레이션 전용)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
