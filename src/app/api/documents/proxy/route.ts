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

    const contentType =
      upstream.headers.get("content-type") ||
      (targetUrl.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");

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
