import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function verifyAdminCredentials(email: string, password: string) {
  // 이메일은 대소문자를 구분하지 않는 것이 사용자 기대에 맞습니다 — 브라우저 자동완성이나
  // 사용자가 대문자로 입력했을 때 존재하는 계정을 못 찾아 로그인이 실패하는 것을 방지합니다.
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) {
    // 타이밍 공격 방지를 위해 존재하지 않는 계정에도 동일한 시간이 걸리는 더미 비교 수행
    await bcrypt.compare(password, "$2a$10$invalidsaltinvalidsaltinvalidsal");
    return null;
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  return valid ? admin : null;
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session.adminId) return null;
  return session;
}
