"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";

export interface DocumentInput {
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: string;
  category: string;
}

export async function getDocuments() {
  try {
    const docs = await db.document.findMany({
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

    // Try to remove the actual file if it was a local upload
    if (existing.fileUrl.startsWith("/uploads/documents/")) {
      try {
        const filePath = path.join(process.cwd(), "public", existing.fileUrl);
        await unlink(filePath);
      } catch {
        // File may not exist on disk — ignore
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
