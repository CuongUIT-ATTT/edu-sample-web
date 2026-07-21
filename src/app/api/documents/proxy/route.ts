import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary for URL signing
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Document proxy: signs Cloudinary URLs server-side and re-serves
 * with proper Content-Type headers so browsers can display files inline.
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
    // Parse public_id and resource_type from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{version}/{public_id_with_ext}
    const urlParts = targetUrl.split("/upload/");
    const pathAfterUpload = urlParts[1] || "";
    const publicId = pathAfterUpload.replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");

    // Detect resource_type from URL path
    let resourceType = "raw";
    if (targetUrl.includes("/image/upload/")) resourceType = "image";
    else if (targetUrl.includes("/video/upload/")) resourceType = "video";

    // Generate a signed URL that Cloudinary will accept
    const signedUrl = cloudinary.url(publicId, {
      type: "authenticated",
      resource_type: resourceType,
      secure: true,
      sign_url: true,
    });

    const upstream = await fetch(signedUrl, {
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
