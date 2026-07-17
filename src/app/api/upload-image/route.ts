import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    if (!file) {
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
    const base64 = Buffer.from(arrayBuffer).toString("base64");

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
      const errText = await imgbbRes.text();
      console.error("ImgBB error:", errText);
      return NextResponse.json(
        { error: "ImgBB từ chối upload. Kiểm tra API key." },
        { status: 502 }
      );
    }

    const imgbbData = await imgbbRes.json();

    if (!imgbbData.success) {
      return NextResponse.json(
        { error: imgbbData.error?.message ?? "Upload thất bại" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: imgbbData.data.display_url as string,
      deleteUrl: imgbbData.data.delete_url as string,
    });
  } catch (err) {
    console.error("Upload image error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
