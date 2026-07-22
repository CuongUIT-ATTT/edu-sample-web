import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { R2, BUCKET, PUBLIC_URL } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
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

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Kích thước tệp tối đa là 20MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const key = `eduweb_documents/${Date.now()}-${safeName}`;

    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    }));

    const fileUrl = `${PUBLIC_URL}/${key}`;
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
    console.error("R2 upload error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải tài liệu lên Cloudflare R2" }, { status: 500 });
  }
}
