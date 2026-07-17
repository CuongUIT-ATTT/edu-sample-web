import React from "react";
import Link from "next/link";
import { BookOpen, Clock, BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";

// Force dynamic page generation to ensure it runs database queries at request time
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const dbCourses = await db.course.findMany({
    where: { published: true },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-16">

        {/* Header Section */}
        <div className="max-w-[700px] flex flex-col gap-4">
          <h1 className="font-display-lg text-4xl font-semibold text-ink">Chương Trình Đào Tạo</h1>
          <p className="font-body text-ink-muted-80">
            Hệ thống bài giảng và môn học chất lượng cao, bám sát khung chương trình chuẩn và mở rộng kiến thức thực tiễn.
          </p>
        </div>

        {/* Courses Grid */}
        {dbCourses.length === 0 ? (
          <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Hiện tại chưa có khóa học nào được đăng tải công khai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dbCourses.map((course) => {
              const lessonsCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
              return (
                <div
                  key={course.id}
                  className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col justify-between hover:border-primary-focus transition-all duration-200"
                >
                  <div className="flex flex-col gap-4">
                    <div className="h-12 w-12 rounded-sm bg-canvas-parchment text-primary flex items-center justify-center">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-ink-muted-48 mb-1">
                        <span>Khối {course.level}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          {course.modules.length} chuyên đề ({lessonsCount} bài học)
                        </span>
                      </div>
                      <h3 className="font-body-strong text-ink text-lg font-semibold leading-tight line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="font-caption text-ink-muted-80 mt-2 line-clamp-3">
                        {course.description || "Khóa học chất lượng cao bám sát chương trình học mới chuẩn Bộ GD&ĐT."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-divider-soft pt-4 mt-6">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-primary hover:underline font-caption font-semibold apple-active-scale"
                    >
                      Học thử bài giảng
                    </Link>
                    <Link
                      href={`/admission?courseId=${course.id}`}
                      className="text-primary hover:underline font-caption font-semibold apple-active-scale"
                    >
                      Đăng ký ngay
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info banner — giải thích cơ chế tài khoản */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 flex items-start gap-3">
          <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
            <strong className="text-ink">Tài khoản học viên được cấp miễn phí</strong> sau khi hoàn thành đăng ký tư vấn lộ trình và được ban tuyển sinh xác nhận. Nhấn <em>"Đăng ký ngay"</em> hoặc <em>"Học thử bài giảng"</em> để bắt đầu.
          </p>
        </div>

      </div>
    </div>
  );
}
