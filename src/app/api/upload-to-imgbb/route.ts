import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy upload base64 image to ImgBB (avoids CORS from browser direct upload).
 * POST { image: "data:image/png;base64,..." } → { url: "https://i.ibb.co/..." }
 */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY || "1e76aab065ef1f9c93204720c9bd4038";
    const form = new FormData();
    form.append("key", apiKey);
    form.append("image", image);

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    const json = await res.json();

    if (json.data?.url) {
      return NextResponse.json({ url: json.data.url });
    }
    return NextResponse.json({ error: "ImgBB upload failed" }, { status: 502 });
  } catch (err) {
    console.error("ImgBB proxy error:", err);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}
