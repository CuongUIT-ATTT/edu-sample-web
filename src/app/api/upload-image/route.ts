import { authorizeUpload, validImage } from "@/lib/upload-validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const denied = await authorizeUpload();
  if (denied) return denied;
  try {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "IMGBB_API_KEY chưa được cấu hình trong .env" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Không có file ảnh" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ định dạng JPG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ảnh tối đa 10MB" },
        { status: 400 }
      );
    }

    // Convert to base64 for ImgBB
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!validImage(buffer, file.type)) return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    const base64 = buffer.toString("base64");

    // Upload to ImgBB
    const imgbbForm = new URLSearchParams();
    imgbbForm.append("key", apiKey);
    imgbbForm.append("image", base64);
    imgbbForm.append("name", file.name.replace(/\.[^.]+$/, ""));

    const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    });

    if (!imgbbRes.ok) {

      return NextResponse.json(
        { error: "ImgBB từ chối upload. Kiểm tra API key." },
        { status: 502 }
      );
    }

    const imgbbData = await imgbbRes.json();

    if (!imgbbData.success) {
      return NextResponse.json(
        { error: "Upload thất bại" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: imgbbData.data.display_url as string,

    });
  } catch (err) {
    console.error("Image upload failed");
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
