import React from "react";
import Link from "next/link";
import { PlayCircle, FileText, ArrowLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

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

  if (!dbCourse) {
    notFound();
  }

  const course = dbCourse;

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
    } as any;
  }

  return (
    <div className="bg-canvas text-ink min-h-screen py-10 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        
        {/* Back Link */}
        <Link href="/courses" className="flex items-center gap-1.5 text-primary hover:underline text-sm font-semibold select-none">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách khóa học
        </Link>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Khóa học môn học</span>
          <h1 className="font-tagline text-3xl font-bold text-ink">{course.title}</h1>
          <p className="text-xs text-ink-muted-80 max-w-[800px] leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* LMS Player Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          
          {/* Main player area (Left) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Responsive Video Container */}
            {activeLesson.videoUrl ? (
              <div className="w-full aspect-video rounded-lg overflow-hidden border border-hairline bg-black shadow-product">
                <iframe
                  src={activeLesson.videoUrl}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-lg border border-hairline bg-slate-900 flex items-center justify-center text-white text-xs">
                Chưa có video bài học này.
              </div>
            )}

            {/* Lesson details cards */}
            <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4 text-left">
              <h2 className="font-body-strong text-lg font-bold text-ink">
                {activeLesson.title}
              </h2>
              
              {activeLesson.content && (
                <p className="text-xs text-ink-muted-80 leading-relaxed">
                  {activeLesson.content}
                </p>
              )}

              {/* Resource Download link if any */}
              {activeLesson.documentUrl && (
                <div className="border-t border-divider-soft pt-4 mt-2">
                  <a
                    href={activeLesson.documentUrl}
                    download
                    className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 px-4 py-2 rounded-pill font-body font-semibold text-xs transition-colors shadow-sm"
                  >
                    <FileText className="h-4 w-4" /> Tải tài liệu đính kèm bài giảng
                  </a>
                </div>
              )}
            </div>

          </div>

          {/* Modules/Lessons Sidebar (Right) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="font-body-strong text-xs font-bold uppercase tracking-wider text-ink border-b border-divider pb-2">
              Danh sách bài giảng
            </h3>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2">
              {course.modules.map((mod) => (
                <div key={mod.id} className="flex flex-col gap-1">
                  <h4 className="font-body-strong text-xs font-bold text-ink-muted-80 bg-surface-pearl px-3 py-1.5 rounded-sm border-l-2 border-primary">
                    {mod.title}
                  </h4>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {mod.lessons.map((lesson) => {
                      const isSelected = lesson.id === activeLesson.id;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${course.id}?lessonId=${lesson.id}`}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-xs transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-primary font-semibold border border-blue-100"
                              : "hover:bg-surface-pearl text-ink-muted-80 border border-transparent"
                          }`}
                        >
                          <span className="truncate pr-4 flex items-center gap-1.5">
                            <PlayCircle className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-primary" : "text-ink-muted-48"}`} />
                            {lesson.title}
                          </span>
                          <ChevronRight className="h-3 w-3 text-ink-muted-48 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
