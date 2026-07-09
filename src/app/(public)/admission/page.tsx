import React from "react";

export default function AdmissionPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[640px] mx-auto bg-canvas border border-hairline rounded-lg p-8 md:p-12 shadow-product">
        
        {/* Header */}
        <div className="flex flex-col gap-3 text-center mb-8">
          <h1 className="font-display-lg text-3xl font-semibold text-ink">Đăng Ký Tuyển Sinh</h1>
          <p className="font-caption text-ink-muted-80">
            Điền thông tin trực tuyến để thực hiện nộp hồ sơ xét tuyển năm học 2026 - 2027.
          </p>
        </div>

        {/* Mock Admission Form */}
        <form className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-caption-strong text-ink text-xs">Họ và tên học sinh *</label>
            <input 
              type="text" 
              placeholder="Nguyễn Văn A" 
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Ngày sinh học sinh *</label>
              <input 
                type="date" 
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Lớp đăng ký tuyển sinh *</label>
              <select 
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full appearance-none"
                required
              >
                <option value="">Chọn khối lớp</option>
                <option value="10">Khối Lớp 10</option>
                <option value="11">Khối Lớp 11</option>
                <option value="12">Khối Lớp 12</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-caption-strong text-ink text-xs">Họ và tên phụ huynh / người giám hộ *</label>
            <input 
              type="text" 
              placeholder="Nguyễn Văn B" 
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Số điện thoại liên hệ *</label>
              <input 
                type="tel" 
                placeholder="0901234567" 
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Email liên hệ *</label>
              <input 
                type="email" 
                placeholder="phuhuynh@example.com" 
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-caption-strong text-ink text-xs">Ghi chú thêm về học sinh (năng khiếu, sức khỏe...)</label>
            <textarea 
              rows={3}
              placeholder="Ghi chú tại đây..." 
              className="bg-canvas border border-hairline rounded-lg px-5 py-3 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full resize-none"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="agree" className="h-4 w-4 rounded border-hairline text-primary focus:ring-primary-focus" required />
            <label htmlFor="agree" className="text-xs text-ink-muted-80 cursor-pointer select-none">
              Tôi cam kết các thông tin khai báo trên là chính xác và hoàn toàn chịu trách nhiệm.
            </label>
          </div>

          <button 
            type="submit" 
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4"
          >
            Nộp đơn đăng ký
          </button>
        </form>

      </div>
    </div>
  );
}
