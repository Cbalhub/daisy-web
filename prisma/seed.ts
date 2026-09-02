import "dotenv/config";
import { hash } from "@node-rs/bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@movd.co.kr").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123!";

  const passwordHash = await hash(password, 10); // src/lib/hash.ts BCRYPT_COST 와 동일

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "관리자" },
  });

  console.log(`관리자 계정 준비 완료: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(
      `기본 비밀번호(${password})를 사용 중입니다. .env에 SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD를 설정한 뒤 다시 시드하고, 최초 로그인 후 반드시 변경하세요.`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
