import React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

const ARTICLES = [
  {
    id: "art-1",
    title: "Khai mạc năm học mới 2026 - 2027",
    excerpt: "Lễ khai giảng diễn ra trang trọng với sự tham gia của đại diện Sở Giáo dục và toàn thể giáo viên, học sinh.",
    date: "05/09/2026",
    category: "Sự kiện",
  },
  {
    id: "art-2",
    title: "Công bố danh sách học bổng tài năng trẻ kỳ I",
    excerpt: "Nhà trường biểu dương các em học sinh có thành tích xuất sắc và trao tặng các suất học bổng khuyến học.",
    date: "20/08/2026",
    category: "Thông báo",
  },
  {
    id: "art-3",
    title: "Ứng dụng nền tảng số hóa vào quản lý học đường trực tuyến",
    excerpt: "Hệ thống quản lý điểm danh và thời khóa biểu mới giúp giảm tải thủ tục hành chính và tăng hiệu quả tương tác.",
    date: "15/07/2026",
    category: "Tin công nghệ",
  },
];

export default function NewsPage() {
  return (
    <div className="bg-canvas min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-12">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-hairline pb-8">
          <h1 className="font-display-lg text-4xl font-semibold text-ink">Bản Tin & Sự Kiện</h1>
          <p className="font-body text-ink-muted-80">
            Cập nhật các hoạt động mới nhất, thông báo học vụ và sự kiện ngoại khóa nổi bật tại nhà trường.
          </p>
        </div>

        {/* Article Stack */}
        <div className="flex flex-col gap-10">
          {ARTICLES.map((article) => (
            <article key={article.id} className="flex flex-col md:flex-row gap-6 justify-between items-start border-b border-divider-soft pb-8 last:border-0">
              <div className="flex flex-col gap-2 max-w-[700px]">
                <div className="flex items-center gap-3 text-xs text-ink-muted-48">
                  <span className="font-semibold text-primary">{article.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {article.date}</span>
                </div>
                <h2 className="font-tagline text-xl font-semibold text-ink hover:text-primary transition-colors cursor-pointer">
                  {article.title}
                </h2>
                <p className="font-body text-ink-muted-80 text-sm">
                  {article.excerpt}
                </p>
              </div>
              <Link 
                href={`/news/${article.id}`} 
                className="text-primary hover:underline font-caption font-semibold whitespace-nowrap md:mt-6 apple-active-scale"
              >
                Đọc tiếp
              </Link>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
}
