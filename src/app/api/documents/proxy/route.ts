import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

/**
 * Document proxy: signs Cloudinary URLs server-side and re-serves
 * with proper Content-Type headers so browsers can display files inline.
 */
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
    // Build a signed Cloudinary URL manually for authenticated raw files
    const urlObj = new URL(targetUrl);
    const pathParts = urlObj.pathname.split("/");
    // e.g. /k5p3v8aa/raw/upload/v1784643478/eduweb_documents/file.pdf
    const resourceType = pathParts[2] || "raw";
    const publicIdWithExt = pathParts.slice(4).join("/");
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, "");

    // Generate timestamp and SHA1 signature
    // Flags must be included in the signature string
    const timestamp = Math.floor(Date.now() / 1000);
    const flags = "fl_inline";
    const toSign = `flags=${flags}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = createHash("sha1").update(toSign).digest("hex");

    const signedUrl = `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/fl_inline?public_id=${encodeURIComponent(publicId)}&api_key=${API_KEY}&timestamp=${timestamp}&signature=${signature}`;

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
