import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const resolvedParams = await params;
  const filename = resolvedParams.filename;
  
  // 1. Session Auth Check
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: "Bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản học viên để tải tài liệu VIP." },
      { status: 401 }
    );
  }

  // Check roles allowed: STUDENT, TEACHER, PARENT, ADMIN
  const allowedRoles = ["STUDENT", "TEACHER", "PARENT", "ADMIN"];
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { error: "Tài khoản của bạn không có đặc quyền truy cập tài liệu VIP." },
      { status: 403 }
    );
  }

  // 2. Generate dummy PDF response payload for download
  const dummyFileContent = `--- TÀI LIỆU VIP - ĐỘC QUYỀN ĐÀO TẠO THẦY HÙNG CƯỜNG ---
Học viên: ${session.name} (${session.email})
Tên tệp: ${filename}
Ngày xuất bản tải về: ${new Date().toLocaleDateString("vi-VN")}

Nội dung: Tài liệu luyện thi chuyên sâu của Thầy Hùng Cường.
Vui lòng không sao chép hoặc phân phối tài liệu này ra ngoài cộng đồng.
Chúc bạn ôn thi đạt kết quả tốt nhất!
`;

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(dummyFileContent, {
    status: 200,
    headers,
  });
}
