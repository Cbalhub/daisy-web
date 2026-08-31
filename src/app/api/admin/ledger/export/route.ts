import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getLedgerEntries, buildLedgerCsv, type CustomerType } from "@/lib/admin/ledger";

export const runtime = "nodejs";

function formatDateForFilename(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const customerType: CustomerType | undefined =
    typeParam === "INDIVIDUAL" || typeParam === "BUSINESS" ? typeParam : undefined;

  // from/to가 둘 다 있으면 원하는 기간을 그대로 씁니다 — 없으면 기존처럼
  // 특정 월(y/m) 기준으로 내보냅니다.
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let entries;
  let filenameSuffix: string;

  if (fromParam && toParam) {
    const from = new Date(`${fromParam}T00:00:00`);
    // "to" 날짜는 하루의 끝까지 포함해야, 그날 생성된 거래가 자정 기준으로 빠지지 않습니다.
    const toExclusive = new Date(`${toParam}T00:00:00`);
    toExclusive.setDate(toExclusive.getDate() + 1);
    if (Number.isNaN(from.getTime()) || Number.isNaN(toExclusive.getTime()) || from >= toExclusive) {
      return NextResponse.json({ error: "잘못된 날짜 범위입니다." }, { status: 400 });
    }
    ({ entries } = await getLedgerEntries(from, toExclusive, customerType));
    filenameSuffix = `${formatDateForFilename(from)}_to_${fromParam === toParam ? fromParam : toParam}`;
  } else {
    const now = new Date();
    const year = Number(url.searchParams.get("y")) || now.getFullYear();
    const month = Number(url.searchParams.get("m")) || now.getMonth() + 1;
    const quarter = Number(url.searchParams.get("q")) || Math.floor(now.getMonth() / 3) + 1;
    const p = url.searchParams.get("p");
    if (!Number.isInteger(year) || month < 1 || month > 12 || quarter < 1 || quarter > 4) {
      return NextResponse.json({ error: "잘못된 기간입니다." }, { status: 400 });
    }
    let start: Date;
    let end: Date;
    if (p === "y") {
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
      filenameSuffix = `${year}`;
    } else if (p === "q") {
      start = new Date(year, (quarter - 1) * 3, 1);
      end = new Date(year, quarter * 3, 1);
      filenameSuffix = `${year}-Q${quarter}`;
    } else {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 1);
      filenameSuffix = `${year}-${String(month).padStart(2, "0")}`;
    }
    ({ entries } = await getLedgerEntries(start, end, customerType));
  }

  const csv = buildLedgerCsv(entries);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="overcook-ledger-${filenameSuffix}.csv"`,
    },
  });
}
