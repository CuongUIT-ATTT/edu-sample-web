import { NextRequest, NextResponse } from "next/server";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const AUTH = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(rawUrl);
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.includes("cloudinary.com")) {
      return NextResponse.json({ error: "Only Cloudinary URLs are allowed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Try direct fetch first (for public uploads / newer files with access_type:"public")
    let upstream = await fetch(targetUrl, { headers: { "User-Agent": "EduWeb-Proxy/1.0" } });

    // If 401, redirect to Cloudinary's own signed URL via admin API
    if (upstream.status === 401) {
      const urlObj = new URL(targetUrl);
      const pathParts = urlObj.pathname.split("/");
      const resourceType = pathParts[2] || "raw";
      const publicId = pathParts.slice(5).join("/");

      const metaUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`;
      const metaRes = await fetch(metaUrl, {
        headers: { "Authorization": `Basic ${AUTH}` },
      });

      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta?.secure_url) {
          // Generate a time-limited signed URL and redirect
          const timestamp = Math.floor(Date.now() / 1000);
          const toSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
          const { createHash } = require("crypto");
          const signature = createHash("sha1").update(toSign).digest("hex");
          const signedUrl = `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${publicId}?api_key=${API_KEY}&timestamp=${timestamp}&signature=${signature}`;
          return NextResponse.redirect(signedUrl, 302);
        }
      }
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    // Determine Content-Type from extension
    const MIME_MAP: Record<string, string> = {
      ".pdf": "application/pdf",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".ppt": "application/vnd.ms-powerpoint",
    };
    const ext = "." + (targetUrl.toLowerCase().split(".").pop() || "");
    const contentType =
      upstream.headers.get("content-type") ||
      MIME_MAP[ext] ||
      "application/octet-stream";

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[proxy] Error:", err);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 502 });
  }
}
