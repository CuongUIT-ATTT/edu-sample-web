import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function authorizeUpload() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export function validImage(buffer: Buffer, mime?: string): boolean {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return false;
  const type = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "image/jpeg"
    : buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
    : ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString()) ? "image/gif"
    : buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP" ? "image/webp" : null;
  return !!type && (!mime || type === mime);
}

export function decodeImage(value: unknown): Buffer | null {
  if (typeof value !== "string" || value.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 100) return null;
  const match = /^(?:data:(image\/(?:png|jpeg|gif|webp));base64,)?([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) return null;
  const buffer = Buffer.from(match[2], "base64");
  return validImage(buffer, match[1]) ? buffer : null;
}

// Only the application's existing image CDN may be fetched remotely. Never
// follow redirects to arbitrary hosts or buffer an unbounded remote response.
export async function readUploadImage(value: unknown): Promise<Buffer | null> {
  const inline = decodeImage(value);
  if (inline) return inline;
  if (typeof value !== "string") return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "i.ibb.co" || url.port || url.username || url.password) return null;
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!response.ok || !response.body) return null;
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.length;
      if (size > MAX_IMAGE_BYTES) { await reader.cancel(); return null; }
      chunks.push(Buffer.from(chunk));
    }
  } finally { reader.releaseLock(); }
  const buffer = Buffer.concat(chunks);
  return validImage(buffer) ? buffer : null;
}
