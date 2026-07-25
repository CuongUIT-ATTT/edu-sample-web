import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy upload base64 image to ImgBB (avoids CORS from browser direct upload).
 * POST { image: "data:image/png;base64,..." } → { url: "https://i.ibb.co/..." }
 *
 * Uses FormData multipart (same as working /api/upload-image route).
 */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "IMGBB_API_KEY chưa cấu hình" }, { status: 500 });
    }

    // Convert base64 string to binary Buffer (same as working upload-image route)
    let rawBase64: string;
    if (image.startsWith("data:image/")) {
      const parts = image.split(",");
      rawBase64 = parts[1];
    } else {
      rawBase64 = image;
    }

    const imgBuffer = Buffer.from(rawBase64, "base64");

    // Use FormData with Blob (binary) — same as working upload-image route
    const imgbbForm = new FormData();
    imgbbForm.append("key", apiKey);
    imgbbForm.append("image", new Blob([imgBuffer]), "upload.png");

    const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
      signal: AbortSignal.timeout(30000),
    });

    const json = await imgbbRes.json();

    if (json.success && json.data?.url) {
      return NextResponse.json({ url: json.data.url });
    }

    console.error("ImgBB error:", json.error);
    return NextResponse.json({ error: json.error?.message || "ImgBB upload failed" }, { status: 502 });
  } catch (err) {
    console.error("ImgBB proxy error:", err);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}
