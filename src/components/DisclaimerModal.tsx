"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, BookOpen, Scale } from "lucide-react";

const STORAGE_KEY = "eduweb_disclaimer_accepted";

export default function DisclaimerModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        setShow(true);
        document.body.style.overflow = "hidden";
      }
    } catch {
      // localStorage not available (SSR guard)
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    document.body.style.overflow = "";
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-canvas border border-hairline rounded-xl shadow-product max-w-xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-700 px-6 py-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-white font-bold text-base leading-tight">
              Chấp nhận Điều khoản & Miễn trừ trách nhiệm
            </h2>
            <p className="text-blue-100 text-xs">
              Vui lòng đọc kỹ trước khi tiếp tục sử dụng EduWeb
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="flex gap-3 items-start">
            <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-ink">Chấp nhận quyền truy cập hệ thống</p>
              <p className="text-[11px] text-ink-muted-80 leading-relaxed">
                Bằng cách sử dụng EduWeb, bạn đồng ý cho phép hệ thống lưu trữ thông tin phiên làm bài (tên thí sinh, điểm số, lịch sử trả lời) phục vụ mục đích thống kê và hiển thị bảng xếp hạng học tập nội bộ.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="h-7 w-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Scale className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-ink">Tuyên bố miễn trừ trách nhiệm</p>
              <p className="text-[11px] text-ink-muted-80 leading-relaxed">
                Toàn bộ nội dung đề thi, câu hỏi, đáp án và tài liệu học tập trên EduWeb được biên soạn cho mục đích <strong>tham khảo, ôn luyện và tự đánh giá năng lực</strong>. EduWeb không cam kết về kết quả thi thực tế. Kết quả thi thử trên hệ thống không thay thế kỳ thi chính thức của Bộ Giáo dục và Đào tạo.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="h-7 w-7 rounded-md bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-ink">Cam kết bảo mật thông tin</p>
              <p className="text-[11px] text-ink-muted-80 leading-relaxed">
                EduWeb cam kết bảo mật dữ liệu cá nhân theo chính sách quyền riêng tư. Thông tin cá nhân (email, số điện thoại, mật khẩu) được mã hóa và không chia sẻ cho bên thứ ba. Bạn có thể xem <a href="/privacy" className="text-primary underline" target="_blank" rel="noopener">Chính sách bảo mật</a> và <a href="/terms" className="text-primary underline" target="_blank" rel="noopener">Điều khoản sử dụng</a> đầy đủ tại đây.
              </p>
            </div>
          </div>

          <div className="bg-surface-pearl border border-divider-soft rounded-lg p-3 text-[11px] text-ink-muted-80 leading-relaxed">
            <strong className="text-ink">Lưu ý:</strong> Việc tiếp tục sử dụng trang web đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với toàn bộ các điều khoản, điều kiện sử dụng và tuyên bố miễn trừ trách nhiệm nêu trên.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-divider-soft bg-surface-pearl flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-[10px] text-ink-muted-48 text-center sm:text-left">
            Thông báo này chỉ hiển thị một lần trên thiết bị này.
          </p>
          <button
            onClick={handleAccept}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill text-xs font-bold apple-active-scale transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
          >
            Tôi đồng ý và tiếp tục truy cập ✓
          </button>
        </div>
      </div>
    </div>
  );
}
