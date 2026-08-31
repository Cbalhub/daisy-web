import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import type { Order } from "@prisma/client";
import type { BusinessSettings } from "@prisma/client";

const WIDTH = 1000;
const HEIGHT = 1300;

type LineItem = { label: string; amount?: number };

function parseLineItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is LineItem => typeof v === "object" && v !== null && typeof (v as LineItem).label === "string"
  );
}

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

/**
 * 관리자용 라우트(/api/admin/orders/[id]/quote)와 고객용 라우트
 * (/api/pay/[orderToken]/quote)가 인증 방식만 다르고 그리는 이미지는
 * 완전히 같아서, 실제 렌더링 로직을 여기 하나로 모아 공유합니다.
 */
export async function renderQuoteImage(order: Order, settings: BusinessSettings) {
  const lineItems = parseLineItems(order.lineItems);
  const rows: LineItem[] = lineItems.length > 0 ? lineItems : [{ label: order.title }];

  const fontData = await readFile(
    path.join(process.cwd(), "node_modules/pretendard/dist/public/static/Pretendard-Regular.otf")
  );
  const fontBold = await readFile(
    path.join(process.cwd(), "node_modules/pretendard/dist/public/static/Pretendard-Bold.otf")
  );

  const issuedAt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          padding: "72px 64px",
          fontFamily: "Pretendard",
          color: "#191919",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: "0.02em" }}>
            MOVD
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "#8c8c8c" }}>{issuedAt}</div>
        </div>

        <div style={{ display: "flex", marginTop: 48, fontSize: 44, fontWeight: 700 }}>견적서</div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 24, gap: 8 }}>
          <div style={{ display: "flex", fontSize: 18, color: "#5c5c5c" }}>
            견적번호 · {order.invoiceNumber}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#5c5c5c" }}>고객명 · {order.customerName}</div>
          <div style={{ display: "flex", fontSize: 18, color: "#5c5c5c" }}>프로젝트 · {order.title}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            borderTop: "2px solid #191919",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "16px 4px",
              borderBottom: "1px solid #dedede",
              fontSize: 16,
              fontWeight: 700,
              color: "#8c8c8c",
            }}
          >
            <div style={{ display: "flex" }}>포함 기능</div>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 4px",
                borderBottom: "1px solid #ededed",
                fontSize: 20,
              }}
            >
              <div style={{ display: "flex", width: 6, height: 6, borderRadius: 3, background: "#191919" }} />
              <div style={{ display: "flex", flex: 1 }}>{row.label}</div>
              {typeof row.amount === "number" && (
                <div style={{ display: "flex", fontWeight: 700, color: "#5c5c5c" }}>{won(row.amount)}</div>
              )}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              padding: "24px 4px 8px",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700 }}>합계</div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#191919" }}>
              {won(order.amount)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 4px", fontSize: 15, color: "#8c8c8c" }}>
            부가가치세 별도
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            paddingTop: 24,
            borderTop: "1px solid #dedede",
            fontSize: 14,
            color: "#8c8c8c",
          }}
        >
          <div style={{ display: "flex" }}>
            {settings.businessName}
            {settings.representativeName ? ` · 대표 ${settings.representativeName}` : ""}
            {settings.businessRegNo ? ` · 사업자등록번호 ${settings.businessRegNo}` : ""}
          </div>
          <div style={{ display: "flex" }}>{settings.contactEmail}</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Pretendard", data: fontData, style: "normal", weight: 400 },
        { name: "Pretendard", data: fontBold, style: "normal", weight: 700 },
      ],
      headers: {
        "Content-Disposition": `inline; filename="movd-quote-${order.invoiceNumber}.png"`,
      },
    }
  );
}
