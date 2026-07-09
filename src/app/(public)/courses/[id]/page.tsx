import React from "react";
import Link from "next/link";
import { PlayCircle, FileText, ArrowLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";

// Force dynamic page generation to ensure it runs database queries at request time
export const dynamic = "force-dynamic";

interface CoursePlayerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lessonId?: string }>;
}

export default async function CoursePlayerPage({ params, searchParams }: CoursePlayerPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const courseId = resolvedParams.id;
  const selectedLessonId = resolvedSearchParams.lessonId;

  let dbCourse = null;

  try {
    dbCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Prisma error loading course:", error);
  }

  // Premium fallback course data if database is not seeded
  const course = dbCourse || {
    id: "math-10",
    title: "Toán học nâng cao Lớp 10",
    description: "Chương trình chuyên sâu về Đại số và Hình học không gian chuẩn bị cho học sinh THPT bước vào các kỳ thi quốc gia.",
    modules: [
      {
        id: "m1",
        title: "Chương 1: Đại số chuyên đề - Phương trình bậc hai",
        lessons: [
          {
            id: "l1",
            title: "Bài 1: Phương trình bậc hai nâng cao và hệ thức Vi-ét",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            documentUrl: "/docs/viet-theorem.pdf",
            content: "Tìm hiểu cách chứng minh và áp dụng hệ thức Vi-ét để giải nhanh toán phương trình bậc hai.",
          },
          {
            id: "l2",
            title: "Bài 2: Các phương pháp đặt ẩn phụ nâng cao",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            documentUrl: "/docs/substitution-methods.pdf",
            content: "Nghiên cứu kỹ thuật giải hệ phương trình bằng phương pháp đặt ẩn phụ phức tạp.",
          },
        ],
      },
    ],
  };

  // Find active lesson from query param or default to first
  let activeLesson = course.modules[0]?.lessons[0];
  
  if (selectedLessonId) {
    for (const mod of course.modules) {
      const found = mod.lessons.find((l) => l.id === selectedLessonId);
      if (found) {
        activeLesson = found;
        break;
      }
    }
  }

  if (!activeLesson) {
    activeLesson = {
      id: "no-lesson",
      title: "Chưa có bài học",
      videoUrl: "",
      documentUrl: "",
      content: "",
    };
  }

  return (
    <div className="bg-canvas text-ink min-h-screen py-10 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        
        {/* Back Link */}
        <Link href="/courses" className="flex items-center gap-1.5 text-primary hover:underline text-sm font-semibold select-none">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách khóa học
        </Link>

        {/* Header Block */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-primary font-semibold tracking-wider uppercase select-none">Khóa Học E-Learning</span>
          <h1 className="font-display-lg text-3xl font-semibold text-ink tracking-tight">
            {course.title}
          </h1>
          <p className="font-body text-ink-muted-80 text-sm max-w-[800px]">
            {course.description}
          </p>
        </div>

        {/* Main Grid: Video Player + Modules Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          
          {/* Left Column: Video Player & Lesson Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Video Screen container (mimicking Apple surface-tile drop shadow) */}
            <div className="bg-surface-black rounded-lg overflow-hidden shadow-product aspect-[16/9] w-full relative">
              {activeLesson.videoUrl ? (
                <iframe
                  src={activeLesson.videoUrl}
                  title={activeLesson.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-body-muted text-sm">
                  Không tìm thấy bài giảng video.
                </div>
              )}
            </div>

            {/* Lesson details */}
            <div className="bg-canvas border border-hairline rounded-lg p-6">
              <h2 className="font-tagline text-xl font-semibold text-ink mb-3">
                {activeLesson.title}
              </h2>
              <p className="font-body text-ink-muted-80 text-sm leading-relaxed mb-6">
                {activeLesson.content || "Chưa có mô tả chi tiết cho bài học này."}
              </p>

              {activeLesson.documentUrl && (
                <div className="border-t border-divider-soft pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-body-strong text-xs text-ink font-semibold">Tài liệu đính kèm</p>
                      <p className="text-[10px] text-ink-muted-48">Xem lý thuyết & Bài tập tự luyện (.pdf)</p>
                    </div>
                  </div>
                  <a 
                    href={activeLesson.documentUrl} 
                    download
                    className="bg-surface-pearl border border-divider-soft text-primary hover:bg-divider-soft px-4 py-2 rounded-sm text-xs font-semibold apple-active-scale transition-colors shadow-sm"
                  >
                    Tải về máy
                  </a>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Modules List Sidebar */}
          <div className="flex flex-col gap-6">
            
            <div className="bg-canvas border border-hairline rounded-lg p-6">
              <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4 select-none">
                Nội dung học tập
              </h3>
              
              <div className="flex flex-col gap-6">
                {course.modules.map((mod) => (
                  <div key={mod.id} className="flex flex-col gap-2">
                    <h4 className="font-caption-strong text-ink text-xs uppercase tracking-wider font-bold">
                      {mod.title}
                    </h4>
                    
                    <div className="flex flex-col gap-1.5 mt-2">
                      {mod.lessons.map((les) => (
                        <Link 
                          key={les.id}
                          href={`/courses/${course.id}?lessonId=${les.id}`}
                          className={`flex items-center justify-between text-left p-3 rounded-sm border transition-colors text-xs ${
                            les.id === activeLesson.id 
                              ? "bg-surface-pearl border-primary-focus text-primary font-semibold" 
                              : "bg-canvas border-divider-soft text-ink-muted-80 hover:bg-surface-pearl hover:text-ink"
                          }`}
                        >
                          <span className="flex items-center gap-2 line-clamp-1 pr-2">
                            <PlayCircle className="h-4 w-4 flex-shrink-0" />
                            {les.title}
                          </span>
                          <ChevronRight className="h-3 w-3 flex-shrink-0 text-ink-muted-48" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
