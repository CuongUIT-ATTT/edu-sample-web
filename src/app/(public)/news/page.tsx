import React from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Newspaper, Tag, Sparkles } from "lucide-react";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

const ARTICLES = [
  {
    id: "art-1",
    title: "Khai mạc năm học mới 2026 - 2027",
    excerpt: "Lễ khai giảng diễn ra trang trọng với sự tham gia của đại diện Sở Giáo dục và toàn thể giáo viên, học sinh. Mở ra hành trình học tập chất lượng cao.",
    date: "05/09/2026",
    category: "Sự kiện",
    readTime: "3 phút đọc",
    featured: true,
  },
  {
    id: "art-2",
    title: "Công bố danh sách học bổng tài năng trẻ kỳ I",
    excerpt: "Nhà trường biểu dương các em học sinh có thành tích xuất sắc và trao tặng các suất học bổng khuyến học giá trị trong học kỳ vừa qua.",
    date: "20/08/2026",
    category: "Thông báo",
    readTime: "2 phút đọc",
    featured: false,
  },
  {
    id: "art-3",
    title: "Ứng dụng nền tảng số hóa vào quản lý học đường trực tuyến",
    excerpt: "Hệ thống quản lý điểm danh và thời khóa biểu mới giúp giảm tải thủ tục hành chính và tăng hiệu quả tương tác giữa nhà trường và phụ huynh.",
    date: "15/07/2026",
    category: "Tin công nghệ",
    readTime: "4 phút đọc",
    featured: false,
  },
];

export default function NewsPage() {
  const featuredArticle = ARTICLES.find((a) => a.featured) || ARTICLES[0];
  const regularArticles = ARTICLES.filter((a) => a.id !== featuredArticle.id);

  return (
    <div className="relative bg-canvas min-h-screen py-12 px-4 sm:px-6 overflow-hidden transition-colors duration-300">
      {/* Radiant Background Blur */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,204,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.1),transparent_50%)]" />

      <div className="max-w-[1040px] mx-auto flex flex-col gap-10 relative z-10">
        {/* Header Section */}
        <div className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <StitchIconBadge icon={Newspaper} variant="blue" size="md" />
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full uppercase tracking-wider">
              EduWeb Newsroom
            </span>
          </div>

          <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Bản Tin & Sự Kiện Nổi Bật
          </h1>
          <p className="font-body text-ink-muted-80 text-sm sm:text-base max-w-2xl leading-relaxed">
            Cập nhật các hoạt động mới nhất, thông báo học vụ, thành tích học sinh và sự kiện nổi bật tại nhà trường.
          </p>
        </div>

        {/* Featured Article Hero Card */}
        {featuredArticle && (
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/5 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 border border-white/70 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-xl motion-card flex flex-col gap-6 relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Tin Tiêu Điểm
                </span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  {featuredArticle.category}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-muted-48 font-semibold">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {featuredArticle.date}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-purple-500" /> {featuredArticle.readTime}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-tagline text-2xl sm:text-3xl font-extrabold text-ink hover:text-primary transition-colors">
                <Link href={`/news/${featuredArticle.id}`}>{featuredArticle.title}</Link>
              </h2>
              <p className="font-body text-ink-muted-80 text-sm sm:text-base leading-relaxed">
                {featuredArticle.excerpt}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/news/${featuredArticle.id}`}
                className="inline-flex items-center gap-2 text-white bg-primary hover:bg-primary-focus px-6 py-3 rounded-full font-bold text-xs sm:text-sm apple-active-scale shadow-lg shadow-primary/25 transition-all"
              >
                <span>Xem bài viết chi tiết</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regularArticles.map((article) => (
            <article
              key={article.id}
              className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-lg motion-card flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {article.category}
                  </span>
                  <span className="text-xs font-semibold text-ink-muted-48 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> {article.date}
                  </span>
                </div>

                <h2 className="font-tagline text-xl font-bold text-ink hover:text-primary transition-colors leading-snug">
                  <Link href={`/news/${article.id}`}>{article.title}</Link>
                </h2>

                <p className="font-body text-ink-muted-80 text-xs sm:text-sm leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-hairline/60">
                <span className="text-xs font-medium text-ink-muted-48 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {article.readTime}
                </span>
                <Link
                  href={`/news/${article.id}`}
                  className="text-primary hover:text-primary-focus text-xs font-extrabold flex items-center gap-1.5 apple-active-scale"
                >
                  <span>Đọc tiếp</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
