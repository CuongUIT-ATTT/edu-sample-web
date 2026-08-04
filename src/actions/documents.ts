"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { teacherClassIds, teacherOwnsClass } from "@/lib/teacher-classes";
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
  classIds?: string[]; // class visibility: if set, doc is visible only to these classes
}

export async function getDocuments(onlyPublished = false) {
  try {
    const session = await getSession();
    // TEACHER: chỉ thấy documents mình tạo HOẶC thuộc lớp mình phụ trách
    if (session?.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      const owned = teacherProfile ? await teacherClassIds(session.userId) : [];
      const docs = await db.document.findMany({
        where: {
          ...(onlyPublished ? { published: true } : {}),
          OR: [
            ...(teacherProfile ? [{ createdById: teacherProfile.id }] : []),
            ...(owned.length > 0 ? [{ classVisibility: { some: { classId: { in: owned } } } }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: docs };
    }

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

    // TEACHER: chỉ gán tài liệu cho lớp mình phụ trách
    let createdById: string | null = null;
    if (session.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      if (!teacherProfile) return { success: false, error: "Không tìm thấy hồ sơ giảng viên." };
      createdById = teacherProfile.id;
      if (input.classIds?.length) {
        const owned = await teacherClassIds(session.userId);
        const invalid = input.classIds.filter((cid) => !owned.includes(cid));
        if (invalid.length > 0) {
          return { success: false, error: "Bạn không được gán tài liệu cho lớp không phụ trách." };
        }
      }
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
        createdById,
        classVisibility: input.classIds?.length
          ? { create: input.classIds.map((cid) => ({ classId: cid })) }
          : undefined,
      },
      include: { classVisibility: true },
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

    // TEACHER: chỉ sửa document mình tạo, và chỉ gán lớp mình phụ trách
    if (session.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      const existing = await db.document.findUnique({ where: { id } });
      if (!existing) return { success: false, error: "Tài liệu không tồn tại." };
      if (!teacherProfile || existing.createdById !== teacherProfile.id) {
        return { success: false, error: "Bạn không có quyền sửa tài liệu này." };
      }
      if (input.classIds?.length) {
        const owned = await teacherClassIds(session.userId);
        const invalid = input.classIds.filter((cid) => !owned.includes(cid));
        if (invalid.length > 0) {
          return { success: false, error: "Bạn không được gán tài liệu cho lớp không phụ trách." };
        }
      }
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
        ...(input.classIds !== undefined && {
          classVisibility: {
            deleteMany: {},
            create: input.classIds.map((cid) => ({ classId: cid })),
          },
        }),
      },
      include: { classVisibility: true },
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

    // TEACHER: chỉ publish document mình tạo
    if (session.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      const existing = await db.document.findUnique({ where: { id } });
      if (!existing) return { success: false, error: "Tài liệu không tồn tại." };
      if (!teacherProfile || existing.createdById !== teacherProfile.id) {
        return { success: false, error: "Bạn không có quyền thay đổi tài liệu này." };
      }
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

    // TEACHER: chỉ xóa document mình tạo
    if (session.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      if (!teacherProfile || existing.createdById !== teacherProfile.id) {
        return { success: false, error: "Bạn không có quyền xóa tài liệu này." };
      }
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

export async function getDocumentsForStudent(studentClassIds: string[]) {
  try {
    const docs = await db.document.findMany({
      where: {
        OR: [
          { published: true },
          { classVisibility: { some: { classId: { in: studentClassIds } } } },
        ],
      },
      include: { classVisibility: { include: { class: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: docs };
  } catch (err) {
    console.error("getDocumentsForStudent error:", err);
    return { success: false, error: "Không thể tải tài liệu." };
  }
}
