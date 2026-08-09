import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock PayOS client + reconcile để test route handler (không cần key thật / DB thật).
const verifyMock = vi.fn();
const applyMock = vi.fn();

vi.mock("@/lib/payos", () => ({
  payos: { webhooks: { verify: (...args: unknown[]) => verifyMock(...args) } },
  isPayosConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/payos-reconcile", () => ({
  applyPayosSuccess: (...args: unknown[]) => applyMock(...args),
}));

// Route handler import sau khi mock — module-level mocks đã active.
import { POST } from "@/app/api/webhooks/payos/route";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/payos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validData = {
  orderCode: 123,
  amount: 72000,
  description: "HP test",
  accountNumber: "123",
  reference: "ref-x",
  transactionDateTime: "2026-08-09 12:00:00",
  currency: "VND",
  paymentLinkId: "pl-1",
  code: "00",
  desc: "success",
};

describe("PayOS webhook route", () => {
  beforeEach(() => {
    verifyMock.mockReset();
    applyMock.mockReset();
    // Mặc định: verify thành công, reconcile trả applied.
    verifyMock.mockResolvedValue(validData);
    applyMock.mockResolvedValue({ status: "applied", tuitionId: "t-1" });
  });

  it("body JSON lỗi → 400", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/payos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("signature sai (verify throw) → 400", async () => {
    verifyMock.mockRejectedValue(new Error("Data not integrity"));
    const res = await POST(makeRequest({ code: "00", desc: "x", success: true, data: validData, signature: "bad" }));
    expect(res.status).toBe(400);
  });

  it("payload success nhưng code !== '00' (ping/test) → 200, không reconcile", async () => {
    const res = await POST(
      makeRequest({ code: "11", desc: "test", success: true, data: validData, signature: "x" })
    );
    expect(res.status).toBe(200);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("giao dịch thành công → verify + reconcile, trả 200 { success: true }", async () => {
    const res = await POST(
      makeRequest({ code: "00", desc: "success", success: true, data: validData, signature: "x" })
    );
    expect(verifyMock).toHaveBeenCalled();
    expect(applyMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: "00", data: validData, signature: "x" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("applied");
  });

  it("reconcile lỗi (DB lỗi) → 500 để PayOS retry", async () => {
    applyMock.mockRejectedValue(new Error("db down"));
    const res = await POST(
      makeRequest({ code: "00", desc: "success", success: true, data: validData, signature: "x" })
    );
    expect(res.status).toBe(500);
  });
});
