import React from "react";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

const ARTICLES = [
  {
    id: "art-1",
    title: "Khai mạc năm học mới 2026 - 2027",
    excerpt: "Lễ khai giảng diễn ra trang trọng với sự tham gia của đại diện Sở Giáo dục và toàn thể giáo viên, học sinh.",
    content: "Lễ khai giảng năm học mới 2026 - 2027 đã chính thức diễn ra vào sáng nay trong không khí tưng bừng và trang trọng. Tham dự buổi lễ có các đại diện đến từ Sở Giáo dục và Đào tạo, Ban giám hiệu nhà trường cùng toàn thể đội ngũ cán bộ, giáo viên và học sinh. Trong năm học mới này, EduWeb tiếp tục cam kết nâng cao chất lượng dạy và học trực tuyến, bồi dưỡng tài năng trẻ và hỗ trợ sát sao các em học sinh trên con đường chinh phục ước mơ đại học.",
    date: "05/09/2026",
    category: "Sự kiện",
  },
  {
    id: "art-2",
    title: "Công bố danh sách học bổng tài năng trẻ kỳ I",
    excerpt: "Nhà trường biểu dương các em học sinh có thành tích xuất sắc và trao tặng các suất học bổng khuyến học.",
    content: "Nhằm động viên tinh thần nỗ lực vươn lên trong học tập, Ban giám hiệu EduWeb chính thức công bố danh sách học sinh đạt học bổng khuyến học học kỳ I năm học 2026 - 2027. Các em học sinh trong danh sách đã có thành tích xuất sắc trong các kỳ thi thử khảo sát chất lượng và có những đóng góp tích cực vào phong trào học tập thi đua toàn trường. Chúc các em tiếp tục phát huy tinh thần hiếu học và đạt kết quả cao hơn nữa trong chặng đường sắp tới.",
    date: "20/08/2026",
    category: "Thông báo",
  },
  {
    id: "art-3",
    title: "Ứng dụng nền tảng số hóa vào quản lý học đường trực tuyến",
    excerpt: "Hệ thống quản lý điểm danh và thời khóa biểu mới giúp giảm tải thủ tục hành chính và tăng hiệu quả tương tác.",
    content: "Nhằm nâng cao trải nghiệm học tập và chuyển đổi số toàn diện, EduWeb chính thức đưa vào vận hành hệ thống quản lý học đường số hóa phiên bản mới. Hệ thống tích hợp các tính năng nổi bật như thời khóa biểu tương tác Google Calendar style, hệ thống điểm danh tự động, giao bài tập và chấm điểm bài tập về nhà theo thời gian thực. Điều này giúp tối ưu hóa quy trình quản lý, tăng cường kết nối giữa giáo viên - học sinh - phụ huynh một cách thông suốt và minh bạch nhất.",
    date: "15/07/2026",
    category: "Tin công nghệ",
  },
];

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = ARTICLES.find((a) => a.id === id);

  if (!article) {
    notFound();
  }

  return (
    <div className="bg-canvas min-h-screen py-16 px-6">
      <div className="max-w-[760px] mx-auto flex flex-col gap-8">
        
        {/* Back Link */}
        <Link href="/news" className="flex items-center gap-1.5 text-primary hover:underline text-xs font-semibold select-none">
          <ArrowLeft className="h-4 w-4" /> Quay lại bản tin &amp; sự kiện
        </Link>

        {/* Article content */}
        <article className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 border-b border-divider pb-6">
            <div className="flex items-center gap-3 text-xs text-ink-muted-48">
              <span className="font-semibold text-primary">{article.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {article.date}</span>
            </div>
            <h1 className="font-tagline text-3xl font-bold text-ink leading-tight">
              {article.title}
            </h1>
          </div>

          <p className="font-body text-ink text-sm leading-relaxed whitespace-pre-wrap">
            {article.content}
          </p>
        </article>

      </div>
    </div>
  );
}
