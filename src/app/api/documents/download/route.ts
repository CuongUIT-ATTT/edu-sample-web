import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Document download: generates a signed Cloudinary URL with fl_attachment
 * and redirects directly to Cloudinary CDN for fast download.
 * No file goes through the server — just a 302 redirect.
 *
 * Usage: /api/documents/download?url=ENCODED_CLOUDINARY_URL&name=filename.pdf
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const fileName = req.nextUrl.searchParams.get("name") || "download";

  if (!rawUrl) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(rawUrl);
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.includes("cloudinary.com")) {
      return Response.json({ error: "Only Cloudinary URLs are allowed" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Generate signed URL with fl_attachment for direct CDN download
    const signedUrl = cloudinary.url(targetUrl, {
      type: "authenticated",
      secure: true,
      flags: `fl_attachment:${fileName}`,
    });

    // Redirect directly to Cloudinary CDN — no bandwidth through our server
    return Response.redirect(signedUrl, 302);
  } catch (err) {
    console.error("Download redirect error:", err);
    return Response.json({ error: "Failed to generate download link" }, { status: 500 });
  }
}
