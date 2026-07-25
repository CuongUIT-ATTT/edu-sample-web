import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { R2, BUCKET, PUBLIC_URL } from "@/lib/r2";

/**
 * Upload base64 image to Cloudflare R2 (free, no rate limit, public access).
 * POST { image: "data:image/png;base64,..." } → { url: "https://pub-...r2.dev/quiz_images/..." }
 */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return Response.json({ error: "Missing image" }, { status: 400 });
    }

    // Extract base64 data and mime type
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return Response.json({ error: "Invalid base64 format" }, { status: 400 });
    }

    const mimeType = match[1];
    const ext = mimeType.split("/")[1] || "png";
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    const key = `quiz_images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    return Response.json({ url: `${PUBLIC_URL}/${key}` });
  } catch (err) {
    console.error("R2 image upload error:", err);
    return Response.json({ error: "Upload error" }, { status: 500 });
  }
}
