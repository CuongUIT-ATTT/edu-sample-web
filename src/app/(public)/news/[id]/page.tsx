import React from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Clock, Share2, Sparkles, Bookmark } from "lucide-react";
import { notFound } from "next/navigation";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

const ARTICLES = [
  {
    id: "art-1",
    title: "Khai mạc năm học mới 2026 - 2027",
    excerpt: "Lễ khai giảng diễn ra trang trọng với sự tham gia của đại diện Sở Giáo dục và toàn thể giáo viên, học sinh.",
    content: "Lễ khai giảng năm học mới 2026 - 2027 đã chính thức diễn ra vào sáng nay trong không khí tưng bừng và trang trọng. Tham dự buổi lễ có các đại diện đến từ Sở Giáo dục và Đào tạo, Ban giám hiệu nhà trường cùng toàn thể đội ngũ cán bộ, giáo viên và học sinh. Trong năm học mới này, EduWeb tiếp tục cam kết nâng cao chất lượng dạy và học trực tuyến, bồi dưỡng tài năng trẻ và hỗ trợ sát sao các em học sinh trên con đường chinh phục ước mơ đại học.\n\nNhà trường đã đầu tư mạnh mẽ vào cơ sở vật chất phòng máy tính, mở rộng kho đề thi trắc nghiệm trực tuyến chuẩn cấu trúc Bộ Giáo dục và nâng cấp hệ thống máy chủ đảm bảo hàng ngàn học sinh có thể tham gia luyện thi cùng lúc mà không gián đoạn.",
    date: "05/09/2026",
    category: "Sự kiện",
    readTime: "3 phút đọc",
  },
  {
    id: "art-2",
    title: "Công bố danh sách học bổng tài năng trẻ kỳ I",
    excerpt: "Nhà trường biểu dương các em học sinh có thành tích xuất sắc và trao tặng các suất học bổng khuyến học.",
    content: "Nhằm động viên tinh thần nỗ lực vươn lên trong học tập, Ban giám hiệu EduWeb chính thức công bố danh sách học sinh đạt học bổng khuyến học học kỳ I năm học 2026 - 2027. Các em học sinh trong danh sách đã có thành tích xuất sắc trong các kỳ thi thử khảo sát chất lượng và có những đóng góp tích cực vào phong trào học tập thi đua toàn trường. Chúc các em tiếp tục phát huy tinh thần hiếu học và đạt kết quả cao hơn nữa trong chặng đường sắp tới.",
    date: "20/08/2026",
    category: "Thông báo",
    readTime: "2 phút đọc",
  },
  {
    id: "art-3",
    title: "Ứng dụng nền tảng số hóa vào quản lý học đường trực tuyến",
    excerpt: "Hệ thống quản lý điểm danh và thời khóa biểu mới giúp giảm tải thủ tục hành chính và tăng hiệu quả tương tác.",
    content: "Nhằm nâng cao trải nghiệm học tập và chuyển đổi số toàn diện, EduWeb chính thức đưa vào vận hành hệ thống quản lý học đường số hóa phiên bản mới. Hệ thống tích hợp các tính năng nổi bật như thời khóa biểu tương tác Google Calendar style, hệ thống điểm danh tự động, giao bài tập và chấm điểm bài tập về nhà theo thời gian thực. Điều này giúp tối ưu hóa quy trình quản lý, tăng cường kết nối giữa giáo viên - học sinh - phụ huynh một cách thông suốt và minh bạch nhất.",
    date: "15/07/2026",
    category: "Tin công nghệ",
    readTime: "4 phút đọc",
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
    <div className="relative bg-canvas min-h-screen py-12 px-4 sm:px-6 overflow-hidden transition-colors duration-300">
      {/* Ambient Radial Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,204,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.1),transparent_50%)]" />

      <div className="max-w-[800px] mx-auto flex flex-col gap-8 relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 text-xs font-bold text-ink hover:text-primary backdrop-blur-lg shadow-sm apple-active-scale transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span>Quay lại trang bản tin</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Lưu bài viết"
              className="p-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 text-ink-muted-80 hover:text-primary backdrop-blur-lg shadow-sm apple-active-scale transition-all"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Chia sẻ bài viết"
              className="p-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 text-ink-muted-80 hover:text-primary backdrop-blur-lg shadow-sm apple-active-scale transition-all"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Article Container */}
        <article className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col gap-8">
          {/* Header Metadata */}
          <div className="flex flex-col gap-4 border-b border-hairline/60 pb-8">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold uppercase tracking-wider">
                {article.category}
              </span>
              <span className="text-ink-muted-48">•</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted-48">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {article.date}
              </span>
              <span className="text-ink-muted-48">•</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted-48">
                <Clock className="h-3.5 w-3.5 text-purple-500" />
                {article.readTime}
              </span>
            </div>

            <h1 className="font-display-lg text-2xl sm:text-4xl font-extrabold text-ink leading-tight tracking-tight">
              {article.title}
            </h1>

            <p className="font-body text-ink-muted-80 text-sm sm:text-base italic leading-relaxed bg-canvas/40 dark:bg-slate-800/40 p-4 rounded-2xl border-l-4 border-primary">
              "{article.excerpt}"
            </p>
          </div>

          {/* Article Body */}
          <div className="font-body text-ink text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
            {article.content}
          </div>

          {/* Article Footer Badge & CTA */}
          <div className="pt-6 border-t border-hairline/60 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <StitchIconBadge icon={Sparkles} variant="blue" size="sm" />
              <span className="text-xs font-bold text-ink-muted-80">
                Tin tức chính thức từ Ban Quản Lý EduWeb
              </span>
            </div>
            <Link
              href="/news"
              className="text-xs font-extrabold text-primary hover:text-primary-focus flex items-center gap-1.5 apple-active-scale"
            >
              <span>Xem các tin khác</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
