import { NextResponse } from "next/server";
import { isAdminOnline } from "@/lib/adminPresence";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ online: isAdminOnline() });
}
