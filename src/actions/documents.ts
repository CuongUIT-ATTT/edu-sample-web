"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { R2, BUCKET } from "@/lib/r2";

// Configure Cloudinary for Server Actions deletion
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface DocumentInput {
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: string;
  category: string;
  published?: boolean;
}

export async function getDocuments(onlyPublished = false) {
  try {
    const docs = await db.document.findMany({
      where: onlyPublished ? { published: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: docs };
  } catch (err) {
    console.error("getDocuments error:", err);
    return { success: false, error: "Không thể tải danh sách tài liệu." };
  }
}

export async function createDocument(input: DocumentInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Không có quyền thực hiện hành động này." };
    }

    const doc = await db.document.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize || null,
        category: input.category.trim() || "Chung",
        published: input.published ?? false,
      },
    });

    revalidatePath("/admin/documents");
    revalidatePath("/teacher/documents");
    revalidatePath("/documents");
    return { success: true, data: doc };
  } catch (err) {
    console.error("createDocument error:", err);
    return { success: false, error: "Tạo tài liệu thất bại." };
  }
}

export async function updateDocument(id: string, input: Partial<DocumentInput>) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Không có quyền thực hiện hành động này." };
    }

    const doc = await db.document.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() || null }),
        ...(input.fileUrl !== undefined && { fileUrl: input.fileUrl }),
        ...(input.fileName !== undefined && { fileName: input.fileName }),
        ...(input.fileType !== undefined && { fileType: input.fileType }),
        ...(input.fileSize !== undefined && { fileSize: input.fileSize || null }),
        ...(input.category !== undefined && { category: input.category.trim() || "Chung" }),
        ...(input.published !== undefined && { published: input.published }),
      },
    });

    revalidatePath("/admin/documents");
    revalidatePath("/teacher/documents");
    revalidatePath("/documents");
    return { success: true, data: doc };
  } catch (err) {
    console.error("updateDocument error:", err);
    return { success: false, error: "Cập nhật tài liệu thất bại." };
  }
}

export async function toggleDocumentPublish(id: string, published: boolean) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Không có quyền thực hiện hành động này." };
    }

    const doc = await db.document.update({
      where: { id },
      data: { published },
    });

    revalidatePath("/admin/documents");
    revalidatePath("/teacher/documents");
    revalidatePath("/documents");
    return { success: true, data: doc };
  } catch (err) {
    console.error("toggleDocumentPublish error:", err);
    return { success: false, error: "Thay đổi trạng thái hiển thị thất bại." };
  }
}

export async function deleteDocument(id: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Không có quyền thực hiện hành động này." };
    }

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Tài liệu không tồn tại." };
    }

    // If it's a Cloudinary link, try to extract public_id and delete the file
    if (existing.fileUrl.includes("res.cloudinary.com")) {
      try {
        const urlParts = existing.fileUrl.split("/upload/");
        if (urlParts.length > 1) {
          const pathWithId = urlParts[1].replace(/^v\d+\//, "");
          const publicIdWithExt = pathWithId;
          const publicIdNoExt = pathWithId.replace(/\.[^.]+$/, "");

          console.log(`Deleting Cloudinary file: id=${publicIdWithExt}, type=raw`);
          const result = await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: "raw" });

          if (result.result === "not found") {
            console.log(`Retrying delete without extension: id=${publicIdNoExt}`);
            await cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "raw" });
          }
        }
      } catch (cloudinaryError) {
        console.error("Failed to delete file from Cloudinary:", cloudinaryError);
      }
    }

    // If it's an R2 link, delete from Cloudflare R2
    if (existing.fileUrl.includes("r2.dev")) {
      try {
        const urlObj = new URL(existing.fileUrl);
        const key = urlObj.pathname.replace(/^\//, "");
        console.log(`Deleting R2 file: key=${key}`);
        await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      } catch (r2Error) {
        console.error("Failed to delete file from R2:", r2Error);
      }
    }

    // If it's an R2 link, delete from Cloudflare R2
    if (existing.fileUrl.includes("r2.dev")) {
      try {
        const urlObj = new URL(existing.fileUrl);
        const key = urlObj.pathname.replace(/^\//, "");
        console.log(`Deleting R2 file: key=${key}`);
        await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      } catch (r2Error) {
        console.error("Failed to delete file from R2:", r2Error);
      }
    }

    await db.document.delete({ where: { id } });

    revalidatePath("/admin/documents");
    revalidatePath("/teacher/documents");
    revalidatePath("/documents");
    return { success: true };
  } catch (err) {
    console.error("deleteDocument error:", err);
    return { success: false, error: "Xóa tài liệu thất bại." };
  }
}
