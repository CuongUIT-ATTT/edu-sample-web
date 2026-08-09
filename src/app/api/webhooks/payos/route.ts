import { NextRequest, NextResponse } from "next/server";
import { type Webhook } from "@payos/node";
import { payos, isPayosConfigured } from "@/lib/payos";
import { applyPayosSuccess } from "@/lib/payos-reconcile";

/**
 * Webhook PayOS — nhận thông báo thanh toán.
 * KHÔNG dùng getSession() (webhook không có cookie); verify bằng checksum key.
 * Không nằm trong matcher của proxy.ts (chỉ cover /admin,/teacher,/student,/parent,/login).
 * Node runtime (mặc định) — PayOS SDK chỉ chạy Node, không đặt edge.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isPayosConfigured()) {
    return NextResponse.json(
      { success: false, error: "PayOS chưa được cấu hình" },
      { status: 503 }
    );
  }

  let body: Webhook;
  try {
    body = (await request.json()) as Webhook;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // verify() nhận OBJECT { code, desc, success, data, signature }
  // và tự tính lại HMAC-SHA256 trên data bằng checksum key; throw nếu sai.
  let verifiedData: Webhook["data"];
  try {
    verifiedData = await payos.webhooks.verify(body);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  // PayOS gửi "ping"/test webhook (code !== "00") — xác nhận, không reconcile.
  if (!body.success || body.code !== "00") {
    return NextResponse.json({ success: true });
  }

  try {
    const result = await applyPayosSuccess({
      code: body.code,
      desc: body.desc,
      success: body.success,
      data: verifiedData,
      signature: body.signature,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    // Trả 5xx để PayOS retry — giao dịch chưa ghi nhận.
    console.error("PayOS webhook reconcile error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
