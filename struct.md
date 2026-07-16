# 🗂️ Cấu trúc thư mục dự án (edu-web File Structure)

Dưới đây là sơ đồ cấu trúc chi tiết các thư mục và tệp tin trong toàn bộ dự án **edu-web**:

```
edu-web/
├── prisma/                    # Cấu hình Cơ sở dữ liệu ORM
│   ├── schema.prisma          # Định nghĩa các bảng Database (SQLite / PostgreSQL)
│   └── migrations/            # Lịch sử các tệp tin Migration của Prisma
│
├── public/                    # Tài nguyên tĩnh công khai (Ảnh, Icons, Fonts...)
│
├── src/                       # Mã nguồn ứng dụng Next.js
│   ├── actions/               # Server Actions (Xử lý logic nghiệp vụ phía Máy chủ)
│   │   ├── auth.ts            # Đăng ký, Đăng nhập, xác thực phiên
│   │   ├── users.ts           # Quản lý tài khoản (Admin/Giảng viên/Học viên/Phụ huynh)
│   │   ├── classes.ts         # Quản lý lớp học & thêm học sinh vào lớp
│   │   ├── schedules.ts       # Quản lý lịch học, tạo chuỗi lặp & kiểm tra trùng lịch
│   │   ├── homework.ts        # Quản lý nộp bài và chấm điểm bài tập về nhà
│   │   ├── quizzes.ts         # Tạo, sửa, nộp bài trắc nghiệm & tính điểm câu Đúng/Sai
│   │   ├── rooms.ts           # Quản lý phòng học
│   │   ├── subjects.ts        # Quản lý môn học
│   │   ├── attendance.ts      # Điểm danh học viên theo tiết học
│   │   └── settings.ts        # Thay đổi thông tin cá nhân/mật khẩu
│   │
│   ├── app/                   # Next.js App Router (Các trang giao diện & API)
│   │   ├── layout.tsx         # Layout chung toàn hệ thống
│   │   ├── globals.css        # CSS tùy biến & thiết lập Tailwind CSS
│   │   │
│   │   ├── (auth)/            # Nhóm định tuyến Xác thực (Authentication)
│   │   │   └── login/         # Trang đăng nhập (/login)
│   │   │
│   │   ├── (public)/          # Các trang công khai cho khách vãng lai
│   │   │   ├── page.tsx       # Trang chủ (/ - Landing page)
│   │   │   ├── quizzes/       # Danh sách đề thi thử & Làm bài thi tự do (/quizzes)
│   │   │   │   └── [id]/      # Chi tiết & Trình làm bài thi của khách (/quizzes/[id])
│   │   │   ├── courses/       # Danh sách khóa học (/courses)
│   │   │   ├── admission/     # Tuyển sinh & Học phí (/admission)
│   │   │   ├── contact/       # Liên hệ trung tâm (/contact)
│   │   │   └── about/         # Giới thiệu trung tâm (/about)
│   │   │
│   │   ├── admin/             # Phân hệ Quản trị viên (Admin Dashboard)
│   │   │   ├── classes/       # Quản lý lớp học (/admin/classes)
│   │   │   ├── schedules/     # Lịch học toàn hệ thống (/admin/schedules)
│   │   │   ├── users/         # Quản lý tài khoản người dùng (/admin/users)
│   │   │   ├── subjects/      # Quản lý môn học (/admin/subjects)
│   │   │   ├── rooms/         # Quản lý phòng học (/admin/rooms)
│   │   │   ├── quizzes/       # Giám sát & Quản trị đề thi thử (/admin/quizzes)
│   │   │   └── settings/      # Cài đặt cá nhân Admin (/admin/settings)
│   │   │
│   │   ├── teacher/           # Phân hệ Giảng viên (Teacher Dashboard)
│   │   │   ├── classes/       # Quản lý danh sách lớp được giao (/teacher/classes)
│   │   │   ├── schedules/     # Lịch dạy cá nhân & Điểm danh (/teacher/schedules)
│   │   │   ├── quizzes/       # Tạo & Thống kê kết quả thi trắc nghiệm (/teacher/quizzes)
│   │   │   └── settings/      # Thay đổi thông tin cá nhân giáo viên (/teacher/settings)
│   │   │
│   │   ├── student/           # Phân hệ Học viên (Student Dashboard)
│   │   │   ├── schedules/     # Lịch học cá nhân & Bài tập về nhà (/student/schedules)
│   │   │   ├── quizzes/       # Làm bài tập trắc nghiệm được giao (/student/quizzes)
│   │   │   ├── attendance/    # Theo dõi lịch sử điểm danh (/student/attendance)
│   │   │   ├── grades/        # Xem bảng điểm cá nhân (/student/grades)
│   │   │   └── settings/      # Thay đổi mật khẩu học viên (/student/settings)
│   │   │
│   │   ├── parent/            # Phân hệ Phụ huynh (Parent Dashboard)
│   │   │   ├── children/      # Xem danh sách con em liên kết (/parent/children)
│   │   │   ├── attendance/    # Theo dõi điểm danh của con (/parent/attendance)
│   │   │   ├── grades/        # Theo dõi học lực, bảng điểm của con (/parent/grades)
│   │   │   └── settings/      # Cài đặt cá nhân phụ huynh (/parent/settings)
│   │   │
│   │   ├── api/               # API Endpoints (Nhận diện Middleware/File uploads)
│   │   │   └── documents/vip  # API bảo vệ tải tài liệu độc quyền cho học viên VIP
│   │   │
│   │   └── unauthorized/      # Trang báo lỗi từ chối truy cập do sai quyền (/unauthorized)
│   │
│   ├── components/            # Các UI Components dùng chung (Shared Components)
│   │   ├── WeeklyTimetable.tsx     # Bảng lịch học (Google Calendar Style) - Core component
│   │   ├── TeacherQuizManager.tsx  # Quản lý đề thi của giáo viên & import CSV/JSON
│   │   ├── UserManagementTable.tsx # Bảng quản lý người dùng nâng cao
│   │   ├── ClassManagementList.tsx # Giao diện lớp học & quản lý học viên của lớp
│   │   ├── SubjectManagement.tsx   # Danh sách quản lý môn học
│   │   ├── RoomManagement.tsx      # Quản lý phòng học
│   │   ├── SettingsForm.tsx        # Form thay đổi thông tin tài khoản chung
│   │   ├── MathRenderer.tsx        # Bộ dựng công thức toán học chuyên nghiệp (KaTeX)
│   │   └── LogoutButton.tsx        # Nút đăng xuất an toàn xóa Cookie Session
│   │
│   ├── lib/                   # Thư viện tiện ích (Utility functions & Types)
│   │   ├── dateUtils.ts       # Xử lý tính toán lệch ngày, Thứ trong tuần khớp date
│   │   ├── timeSlots.ts       # Danh sách giờ học 15 phút & cộng tịnh tiến 90 phút
│   │   └── prisma.ts          # Singleton khởi tạo Prisma client chống rò rỉ kết nối
│   │
│   └── proxy.ts               # Proxy cấu hình các cổng kết nối ngoại vi
│
├── tests/                     # Các kịch bản kiểm thử tự động (Unit Tests)
├── e2e/                       # Kiểm thử toàn trình (End-to-End Tests - Playwright)
│
├── CONTEXT.md                 # Tài liệu tổng quan bối cảnh, nghiệp vụ hệ thống
├── DESIGN.md                  # Hướng dẫn quy chuẩn giao diện cao cấp
├── struct.md                  # Tài liệu cấu trúc tệp tin (Tệp tin này)
├── package.json               # Định nghĩa thư viện phụ thuộc & scripts chạy dự án
├── tsconfig.json              # Cấu hình biên dịch TypeScript nghiêm ngặt
├── next.config.ts             # Cấu hình Turbopack & Next.js Framework
└── tailwind.config.ts         # Cấu hình màu sắc, phông chữ thiết kế Tailwind
```
