import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: "Cloudinary credentials chưa được cấu hình" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt"];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Định dạng tệp không được hỗ trợ (chỉ hỗ trợ PDF, Word, Excel, PowerPoint)" },
        { status: 400 }
      );
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Kích thước tệp tối đa là 20MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Cloudinary as raw resource (for documents)
    const uploadPromise = new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "eduweb_documents",
            public_id: `${Date.now()}-${file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as any);
          }
        ).end(buffer);
      }
    );

    const uploadResult = await uploadPromise;

    const fileSizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    return NextResponse.json({
      url: uploadResult.secure_url,
      fileName: file.name,
      fileSize: fileSizeStr,
      fileType: fileExtension,
    });
  } catch (err) {
    console.error("Cloudinary document upload error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải tài liệu lên Cloudinary" }, { status: 500 });
  }
}
