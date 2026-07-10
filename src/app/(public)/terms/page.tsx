import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[720px] mx-auto bg-canvas border border-hairline rounded-lg p-8 md:p-12 shadow-product flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-1.5 text-primary hover:underline text-xs font-semibold select-none">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
        <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-ink">Điều Khoản Sử Dụng</h1>
        <p className="text-[11px] text-ink-muted-48">Cập nhật lần cuối: 10/07/2026</p>
        
        <div className="font-body text-xs text-ink-muted-80 leading-relaxed flex flex-col gap-4">
          <p>
            Chào mừng bạn sử dụng dịch vụ của **EduWeb**. Khi sử dụng nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau đây:
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">1. Trách nhiệm học tập</h3>
          <p>
            Học viên cần tham gia làm bài tập, thi thử trung thực, không sao chép đáp án, tôn trọng các bạn đồng học và giảng viên phụ trách.
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">2. Sử dụng tài liệu ôn tập</h3>
          <p>
            Tài liệu VIP được phát hành thuộc bản quyền trí tuệ của **Thầy Hùng Cường**. Học viên không được tự ý chia sẻ công khai, bán lại hoặc sử dụng thương mại ngoài khuôn khổ lớp học.
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">3. Thanh toán học phí</h3>
          <p>
            Học phí của các khóa học được thanh toán trước khi bắt đầu tháng học hoặc khóa học. Các chính sách hoàn trả tuân thủ theo cam kết đầu ra đã ghi rõ trong hợp đồng tuyển sinh.
          </p>
        </div>
      </div>
    </div>
  );
}
