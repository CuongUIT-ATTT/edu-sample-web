# 🎓 Dự án edu-web: Hệ thống Quản lý Học tập & Lịch học Thông minh

Tài liệu này tổng hợp toàn diện bối cảnh, các quyết định kỹ thuật, cấu trúc cơ sở dữ liệu và các tính năng cốt lõi của hệ thống quản lý trung tâm giáo dục **edu-web**.

---

## 🚀 1. Tổng quan & Kiến trúc Kỹ thuật

Dự án **edu-web** là một cổng thông tin quản lý học tập đa phân hệ (Multi-role LMS) được thiết kế đặc thù cho các lớp học tương tác cao, kết hợp quản lý lịch biểu chuyên sâu.

### Công nghệ cốt lõi (Tech Stack):
* **Framework**: Next.js 16.2.10 (App Router) với React 19.2.4 và trình biên dịch Turbopack tốc độ cao.
* **Database**: PostgreSQL (Neon Serverless Database) cho môi trường Staging/Production và hỗ trợ tương thích SQLite cho môi trường phát triển cục bộ (Local Offline Development).
* **ORM**: Prisma ORM hỗ trợ định nghĩa schema, format và đồng bộ dữ liệu.
* **CSS & Design**: Sử dụng Vanilla CSS & Tailwind CSS kết hợp thư viện biểu tượng **Lucide React**.
* **Authentication**: Cookie session dựa trên JWT hỗ trợ 4 vai trò: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.
* **Data Flow**: Server Actions đóng vai trò API Endpoints an toàn, tối ưu hóa quá trình revalidate dữ liệu phía máy chủ (Server-side Cache).

---

## 📅 2. Các Tính năng Quản lý Lịch học (Google Calendar Style)

Hệ thống lịch học được tích hợp trong component chính [WeeklyTimetable.tsx](file:///f:/CODE/DevOps/edu-web/src/components/WeeklyTimetable.tsx) là điểm cốt lõi của dự án:

### A. Hiển thị Lịch học Trực quan
* Hỗ trợ hai chế độ xem: **Lịch biểu theo Tuần (WEEK)** chia theo ca giờ chuẩn và **Lịch biểu theo Tháng (MONTH)** dạng lưới ô vuông.
* Có thanh điều hướng dịch chuyển thời gian giữa các tuần, các tháng một cách mượt mà.

### B. Cơ chế Lặp lại hàng tuần & Quản lý Nhóm
* Khi tạo lịch học, hệ thống hỗ trợ cơ chế lặp lại hàng tuần từ ngày bắt đầu đến ngày kết thúc (`startDate` -> `endDate`), tự động gán chung mã nhóm `recurrenceGroupId`.
* Đối với lịch đơn lẻ (`NONE`), trường ngày kết thúc tự động khóa bằng ngày bắt đầu để đồng nhất dữ liệu.

### C. Xóa Ca học thông minh
Hỗ trợ hai phương án xóa an toàn khi click xóa lịch lặp:
* **Chỉ xóa ca này (`ONLY_THIS`)**: Chỉ xóa bản ghi duy nhất của ngày được chọn.
* **Xóa tất cả trong tương lai (`ALL_FUTURE`)**: Xóa toàn bộ chuỗi ca học lặp lại kể từ ngày được chọn trở đi.
* **Rào chắn bảo vệ (Guard)**: Nếu đã có học sinh nộp bài tập về nhà cho ca học muốn xóa, hệ thống sẽ tự động chặn thao tác để tránh mất dữ liệu chấm điểm của lớp.

### D. Chỉnh sửa & Dịch chuyển chuỗi lặp (Update Schedule)
* Cho phép Giáo viên/Admin chuyển giao diện xem chi tiết thành form sửa trực tiếp trong modal.
* Khi chỉnh sửa chuỗi lịch lặp, hệ thống tự động tính toán số ngày lệch (`dateDiff`) để tự động tịnh tiến dịch chuyển ngày học của tất cả các ca tiếp theo trong chuỗi.
* Tích hợp kiểm tra trùng lịch (Overlap Check) an toàn cho cả phòng học, lịch giáo viên, lớp học và đưa ra cảnh báo trùng lịch học sinh nếu phát hiện xung đột thời gian.

---

## 📝 3. Hệ thống Bài tập & Tài liệu Học tập

Để tối ưu chi phí vận hành (0đ), hệ thống sử dụng phương án liên kết URL trực tiếp (Google Drive, OneDrive, Dropbox, v.v.):

### A. Đăng tải Bài học & Tài liệu học tập
* Giáo viên/Admin dán trực tiếp link tài liệu xem trước và đề bài tập về nhà vào từng ca học.
* Quyết định kiến trúc: Đường dẫn được lưu dạng `String` (phân tách bằng dấu phẩy hoặc dạng JSON list) thay vì sử dụng mảng nguyên bản của PostgreSQL (`String[]`). Điều này giúp duy trì khả năng tương thích chéo (cross-db portability), cho phép sử dụng SQLite ở môi trường phát triển cục bộ và PostgreSQL ở môi trường Live.
* Cho phép cấu hình **Hạn nộp bài (Due date)** cụ thể dạng ngày và giờ (`datetime-local`).

### B. Trạng thái nộp bài của Học sinh
* Học sinh click trực tiếp vào ca học trên thời khóa biểu để tải tài liệu ôn tập và nộp link bài làm.
* Hệ thống so sánh trực tiếp thời gian gửi bài `submittedAt` với hạn nộp `homeworkDueDate`:
  * 🟢 Hiển thị nhãn **Đúng hạn** nếu nộp trước deadline.
  * 🔴 Hiển thị nhãn **Nộp muộn** nổi bật màu đỏ nếu nộp quá hạn.

### C. Chấm điểm & Tự động đồng bộ (Sync)
* Giáo viên chấm điểm và nhận xét bài làm trực tiếp trên Modal chi tiết ca học.
* Khi điểm số được lưu, hệ thống tự động gọi cơ chế `upsert` trên bảng điểm `Grade` để cập nhật bảng điểm chung của học viên theo môn học tương ứng.
* Quyết định kiến trúc: Để tối ưu hiệu năng câu lệnh truy vấn của Client (tránh câu lệnh `JOIN` phức tạp khi lấy trạng thái nộp bài), điểm số được lưu trữ song song ở cả `HomeworkSubmission.grade` và `Grade.score`. Tiến trình đồng bộ được thực hiện an toàn, đồng nhất thông qua Transaction cô lập của Prisma.

---

## 🗂️ 4. Sơ đồ Cấu trúc Bảng Cơ sở dữ liệu liên quan

Được định nghĩa chi tiết trong [schema.prisma](file:///f:/CODE/DevOps/edu-web/prisma/schema.prisma):

```mermaid
erDiagram
    Class ||--o{ Schedule : contains
    Subject ||--o{ Schedule : contains
    TeacherProfile ||--o{ Schedule : teaches
    Schedule ||--o{ HomeworkSubmission : has
    StudentProfile ||--o{ HomeworkSubmission : submits
    HomeworkSubmission ||--o| Grade : links(1-1)
    
    Schedule {
        string id PK
        string classId FK
        string subjectId FK
        string teacherId FK
        int dayOfWeek
        string startTime
        string endTime
        string room
        DateTime date
        string recurrenceGroupId
        string materials
        string homework
        DateTime homeworkDueDate
    }
    
    HomeworkSubmission {
        string id PK
        string scheduleId FK
        string studentId FK
        string fileUrl
        string fileName
        DateTime submittedAt
        float grade
        string feedback
    }
    
    Grade {
        string id PK
        string studentId FK
        string subjectId FK
        string teacherId FK
        string homeworkSubmissionId FK
        float score
        string remarks
    }
```

---

## 🛡️ 5. Quy tắc An toàn dữ liệu
1. **Xác nhận trước khi xóa**: Tất cả các thao tác xóa trong hệ thống (Ca học, Bài tập, Lớp học, Môn học, Phòng học, Người dùng) đều yêu cầu xác nhận xác thực `confirm()` từ người dùng trước khi gọi Server Action.
2. **Quy tắc 10 phút điểm danh**: Giảng viên chỉ được phép điểm danh cho ca học bắt đầu từ **10 phút trước giờ vào lớp** cho đến **10 phút sau khi tan lớp**. Quá khoảng thời gian này, chỉ có Admin mới có quyền sửa đổi thông tin điểm danh.
3. **TypeScript & Linter**: Mọi thay đổi mã nguồn luôn phải vượt qua kiểm tra kiểu nghiêm ngặt (`tsc --noEmit`) và các quy tắc linter không có cảnh báo (`eslint src --max-warnings 0`) trước khi được deploy tự động lên production.
