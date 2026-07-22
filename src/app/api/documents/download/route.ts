import { NextRequest } from "next/server";
import { createHash } from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

/**
 * Document download: signs a Cloudinary URL and redirects directly to CDN.
 * No file goes through our server — just a 302 redirect.
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
    // Parse Cloudinary URL to extract resource type and public_id
    const urlObj = new URL(targetUrl);
    const pathParts = urlObj.pathname.split("/");
    const resourceType = pathParts[2] || "raw";
    const publicIdWithExt = pathParts.slice(5).join("/");
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, "");

    // Generate signed URL with fl_attachment for download
    const timestamp = Math.floor(Date.now() / 1000);
    const flags = `fl_attachment:${fileName}`;
    const toSign = `flags=${flags}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = createHash("sha1").update(toSign).digest("hex");

    const signedUrl = `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${flags}?public_id=${encodeURIComponent(publicId)}&api_key=${API_KEY}&timestamp=${timestamp}&signature=${signature}`;

    // 302 redirect to CDN — no bandwidth through our server
    return Response.redirect(signedUrl, 302);
  } catch (err) {
    console.error("Download redirect error:", err);
    return Response.json({ error: "Failed to generate download link" }, { status: 500 });
  }
}
