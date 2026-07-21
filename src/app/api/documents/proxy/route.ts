import { NextRequest, NextResponse } from "next/server";

/**
 * Public PDF proxy: fetches a Cloudinary raw file server-side and
 * re-serves it with proper Content-Type headers so browsers can display it inline.
 * Usage: /api/documents/proxy?url=ENCODED_CLOUDINARY_URL
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow Cloudinary URLs for security
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
    const upstream = await fetch(targetUrl, {
      headers: { "User-Agent": "EduWeb-Proxy/1.0" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    // Determine Content-Type from extension if upstream doesn't provide it
    const MIME_MAP: Record<string, string> = {
      ".pdf": "application/pdf",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".ppt": "application/vnd.ms-powerpoint",
    };
    const ext = targetUrl.toLowerCase().split(".").pop() || "";
    const contentType =
      upstream.headers.get("content-type") ||
      MIME_MAP[`.${ext}`] ||
      "application/octet-stream";

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // inline = display in browser; attachment = force download
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Document proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 502 });
  }
}
