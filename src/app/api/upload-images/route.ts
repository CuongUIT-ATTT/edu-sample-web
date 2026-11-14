import { authorizeUpload, readUploadImage } from "@/lib/upload-validation";
import { NextRequest, NextResponse } from "next/server";

interface UploadResult {
  index: number;
  url: string | null;
  error?: string;
}

const MAX_IMAGES = 30;

/**
 * Batch upload images (base64 data URLs or external URLs) to ImgBB.
 * POST { images: string[] } → { success, results: UploadResult[] }
 */
export async function POST(req: NextRequest) {
  const denied = await authorizeUpload();
  if (denied) return denied;
  try {
    const imgbbKey = process.env.IMGBB_API_KEY;

    if (!imgbbKey) {
      return NextResponse.json(
        { error: "IMGBB_API_KEY chưa được cấu hình trong .env" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const images: string[] = body?.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Thiếu mảng images hoặc mảng rỗng." },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Tối đa ${MAX_IMAGES} ảnh mỗi lần upload.` },
        { status: 400 }
      );
    }

    const buffers = await Promise.all(images.map((image) => readUploadImage(image)));
    if (buffers.some((buffer) => !buffer)) {
      return NextResponse.json({ error: "Invalid image or unsupported remote image host" }, { status: 400 });
    }
    const results: UploadResult[] = await Promise.all(
      buffers.map(async (buffer, index) => {
        try {
          if (!buffer) return { index, url: null, error: "Invalid image" };
          const base64Data = buffer.toString("base64");

          // Upload to ImgBB
          const formData = new FormData();
          formData.append("key", imgbbKey);
          formData.append("image", base64Data);

          const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(30000),
          });

          if (!imgbbRes.ok) {

            return { index, url: null, error: "Upload ImgBB thất bại" };
          }

          const data = await imgbbRes.json();
          if (!data?.data?.url) {
            return { index, url: null, error: "Upload ImgBB thất bại" };
          }

          return { index, url: data.data.url as string };
        } catch (err) {
          return {
            index,
            url: null,
            error: err instanceof Error ? err.message : "Lỗi không xác định",
          };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Image upload failed");
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
