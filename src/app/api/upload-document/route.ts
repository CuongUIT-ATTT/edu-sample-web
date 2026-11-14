import { authorizeUpload,  } from "@/lib/upload-validation";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { R2, BUCKET, PUBLIC_URL } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const denied = await authorizeUpload();
  if (denied) return denied;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!(file instanceof File)) {
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

    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Kích thước tệp tối đa là 20MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isPdf = buffer.subarray(0, 5).toString() === "%PDF-";
    const isZip = buffer.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]));
    const isOle = buffer.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]));
    if (!(fileExtension === "pdf" ? isPdf : ["docx", "xlsx", "pptx"].includes(fileExtension) ? isZip : isOle)) {
      return NextResponse.json({ error: "Invalid document" }, { status: 400 });
    }
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf", doc: "application/msword", xls: "application/vnd.ms-excel", ppt: "application/vnd.ms-powerpoint",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const key = `eduweb_documents/${crypto.randomUUID()}-${safeName}`;

    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeTypes[fileExtension],
      ContentDisposition: "attachment",
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
    console.error("Document upload failed");
    return NextResponse.json({ error: "Lỗi hệ thống khi tải tài liệu lên Cloudflare R2" }, { status: 500 });
  }
}
