import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[720px] mx-auto bg-canvas border border-hairline rounded-lg p-8 md:p-12 shadow-product flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-1.5 text-primary hover:underline text-xs font-semibold select-none">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
        <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-ink">Chính Sách Bảo Mật</h1>
        <p className="text-[11px] text-ink-muted-48">Cập nhật lần cuối: 10/07/2026</p>
        
        <div className="font-body text-xs text-ink-muted-80 leading-relaxed flex flex-col gap-4">
          <p>
            Chào mừng bạn đến với **Trung tâm Luyện thi EduWeb**. Chúng tôi cam kết bảo vệ thông tin cá nhân của học viên, giảng viên và phụ huynh khi tham gia học tập trực tuyến.
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">1. Thu thập thông tin</h3>
          <p>
            Chúng tôi thu thập tên, email, số điện thoại, mật khẩu và dữ liệu học tập (kết quả điểm danh, điểm thi thử) để phục vụ cho nghiệp vụ giảng dạy và theo dõi kết quả của học viên.
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">2. Sử dụng thông tin</h3>
          <p>
            Dữ liệu học tập được dùng để đánh giá năng lực, xếp hạng thi đua tuần/tháng trên bảng xếp hạng (không công khai email hay số điện thoại của học viên ra bên ngoài).
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">3. Chia sẻ thông tin</h3>
          <p>
            EduWeb tuyệt đối không chia sẻ, mua bán dữ liệu cá nhân của học viên hay phụ huynh cho bên thứ ba vì bất kỳ mục đích thương mại nào.
          </p>

          <h3 className="font-body-strong text-sm font-bold text-ink mt-2">4. Bảo mật</h3>
          <p>
            Chúng tôi lưu trữ mật khẩu dưới dạng băm bảo mật (bcrypt) và mã hóa luồng kết nối cơ sở dữ liệu trên Neon PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
}
