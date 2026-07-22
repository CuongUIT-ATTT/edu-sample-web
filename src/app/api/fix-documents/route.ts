import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * One-time script: fix all existing Cloudinary document URLs
 * by updating the upload access_mode to "public".
 * GET /api/fix-documents?token=SECRET
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: any[] = [];
  const AUTH = Buffer.from(
    `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
  ).toString("base64");

  try {
    const docs = await db.document.findMany({
      where: { fileUrl: { contains: "res.cloudinary.com" } },
      select: { id: true, fileUrl: true },
    });

    for (const doc of docs) {
      const urlObj = new URL(doc.fileUrl);
      const pathParts = urlObj.pathname.split("/");
      const resourceType = pathParts[2] || "raw";
      const publicId = pathParts.slice(5).join("/");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}/update`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${AUTH}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ access_mode: "public" }),
        }
      );

      const data = await res.json();
      results.push({ id: doc.id, publicId, status: data.access_mode || data.error?.message || "ok" });
    }

    return NextResponse.json({ updated: results.length, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
