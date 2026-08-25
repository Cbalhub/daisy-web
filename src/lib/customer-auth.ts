import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-session";

export async function createCustomer(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const customer = await prisma.customer.create({
    data: { email, passwordHash, name: input.name, phone: input.phone },
  });

  // 가입 이전에 같은 이메일로 남긴 문의/주문이 있다면 계정에 연결해, 고객이
  // "마이페이지"에서 이전 이력을 바로 볼 수 있게 합니다.
  await prisma.$transaction([
    prisma.inquiry.updateMany({
      where: { email, customerId: null },
      data: { customerId: customer.id },
    }),
    prisma.order.updateMany({
      where: { customerEmail: email, customerId: null },
      data: { customerId: customer.id },
    }),
  ]);

  return customer;
}

export async function verifyCustomerCredentials(email: string, password: string) {
  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!customer) {
    // 타이밍 공격 방지를 위해 존재하지 않는 계정에도 동일한 시간이 걸리는 더미 비교 수행
    await bcrypt.compare(password, "$2a$10$invalidsaltinvalidsaltinvalidsal");
    return null;
  }
  const valid = await bcrypt.compare(password, customer.passwordHash);
  return valid ? customer : null;
}

export async function requireCustomerSession() {
  const session = await getCustomerSession();
  if (!session.customerId) return null;
  return session;
}
