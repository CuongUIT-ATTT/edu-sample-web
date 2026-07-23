import { NextRequest, NextResponse } from "next/server";

interface UploadResult {
  index: number;
  url: string | null;
  error?: string;
}

const MAX_IMAGES = 30;

/**
 * Batch upload images (base64 data URLs or external URLs) to Cloudinary.
 * POST { images: string[] } → { success, results: UploadResult[] }
 */
export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary chưa được cấu hình trong .env" },
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

    const results: UploadResult[] = await Promise.all(
      images.map(async (src, index) => {
        try {
          const formData = new FormData();

          if (src.startsWith("data:image/")) {
            // Base64 data URL — Cloudinary accepts data URLs directly
            formData.append("file", src);
          } else if (src.startsWith("http://") || src.startsWith("https://")) {
            // External URL — fetch and send as blob
            const imgRes = await fetch(src, {
              signal: AbortSignal.timeout(15000),
            });
            if (!imgRes.ok) {
              return { index, url: null, error: `Không tải được ảnh: ${imgRes.status}` };
            }
            const blob = await imgRes.blob();
            formData.append("file", blob, `quiz_img_${index}.png`);
          } else {
            return { index, url: null, error: "Không nhận diện được định dạng ảnh" };
          }

          const timestamp = Math.floor(Date.now() / 1000).toString();
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp);
          formData.append("folder", "quiz_images");

          // Cloudinary signature = sha1(api_secret + timestamp + api_key) is not used with basic auth
          // Use basic auth instead: base64(apiKey:apiSecret)
          const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

          const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: "POST",
              headers: {
                Authorization: authHeader,
              },
              body: formData,
              signal: AbortSignal.timeout(30000),
            }
          );

          if (!cloudinaryRes.ok) {
            const errText = await cloudinaryRes.text();
            console.error(`Cloudinary upload failed [${index}]:`, errText);
            return { index, url: null, error: "Upload thất bại" };
          }

          const data = await cloudinaryRes.json();
          if (!data.secure_url) {
            return { index, url: null, error: "Upload thất bại" };
          }

          return { index, url: data.secure_url as string };
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
    console.error("Batch upload images error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
