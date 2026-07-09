import React from "react";
import Link from "next/link";
import { BookOpen, Star, Clock } from "lucide-react";

const COURSES = [
  {
    id: "math-10",
    name: "Toán học nâng cao Lớp 10",
    description: "Chương trình chuyên sâu về Đại số và Hình học không gian chuẩn bị cho học sinh THPT.",
    level: "Khối 10",
    duration: "36 tuần",
    rating: 4.9,
  },
  {
    id: "phy-11",
    name: "Vật lý lý thuyết & Thực nghiệm Lớp 11",
    description: "Khám phá Cơ học chất lưu, Điện từ học và Quang hình học qua các bài thực hành trực quan.",
    level: "Khối 11",
    duration: "36 tuần",
    rating: 4.8,
  },
  {
    id: "chem-12",
    name: "Hóa học hữu cơ & Vô cơ Lớp 12",
    description: "Ôn tập chuyên đề thi tốt nghiệp THPT Quốc gia và đại học trọng tâm Hóa học.",
    level: "Khối 12",
    duration: "32 tuần",
    rating: 5.0,
  },
  {
    id: "eng-ielts",
    name: "Tiếng Anh học thuật & IELTS 6.5+",
    description: "Rèn luyện tư duy phản biện viết và kỹ năng nghe nói phản xạ tự nhiên chuẩn quốc tế.",
    level: "Mọi khối lớp",
    duration: "24 tuần",
    rating: 4.9,
  },
];

export default function CoursesPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-12">
        
        {/* Header Section */}
        <div className="max-w-[700px] flex flex-col gap-4">
          <h1 className="font-display-lg text-4xl font-semibold text-ink">Chương Trình Đào Tạo</h1>
          <p className="font-body text-ink-muted-80">
            Hệ thống bài giảng và môn học chất lượng cao, bám sát khung chương trình chuẩn và mở rộng kiến thức thực tiễn.
          </p>
        </div>

        {/* Courses Grid using store-utility-card guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COURSES.map((course) => (
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
                    <span>{course.level}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {course.duration}</span>
                  </div>
                  <h3 className="font-body-strong text-ink text-lg font-semibold leading-tight line-clamp-2">
                    {course.name}
                  </h3>
                  <p className="font-caption text-ink-muted-80 mt-2 line-clamp-3">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-divider-soft pt-4 mt-6">
                <div className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{course.rating}</span>
                </div>
                <Link 
                  href={`/login`}
                  className="text-primary hover:underline font-caption font-semibold apple-active-scale"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
