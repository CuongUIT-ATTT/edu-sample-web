import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "pdf" && fileExtension !== "docx") {
      return NextResponse.json(
        { error: "Hệ thống chỉ hỗ trợ tài liệu định dạng PDF và DOCX" },
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });

    // Use timestamp prefix to prevent collisions
    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/documents/${uniqueName}`;
    const fileSizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    return NextResponse.json({
      url: fileUrl,
      fileName: file.name,
      fileSize: fileSizeStr,
      fileType: fileExtension,
    });
  } catch (err) {
    console.error("Upload document error:", err);
    return NextResponse.json({ error: "Lỗi server khi tải tài liệu lên" }, { status: 500 });
  }
}
