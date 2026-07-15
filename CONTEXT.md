# 🎓 Dự án edu-web: Hệ thống Quản lý Học tập & Lịch học Thông minh

Tài liệu này tổng hợp toàn diện bối cảnh, các quyết định kỹ thuật, cấu trúc cơ sở dữ liệu và các tính năng cốt lõi của hệ thống quản lý trung tâm giáo dục **edu-web**.

---

## 🚀 1. Tổng quan & Kiến trúc Kỹ thuật

Dự án **edu-web** là một cổng thông tin quản lý học tập đa phân hệ (Multi-role LMS) được thiết kế đặc thù cho các lớp học tương tác cao, kết hợp quản lý lịch biểu chuyên sâu.

### Công nghệ cốt lõi (Tech Stack):
* **Framework**: Next.js v16.2.10 (phiên bản pre-release/canary build thực tế trong dự án, được kiểm chứng qua lệnh `npx next -v`) đi kèm React v19.2.4 và Turbopack tốc độ cao.
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

### B. Cơ chế Lặp lại hàng tuần & Quản lý Nhóm (Fix 1 & Fix 4)
* Khi tạo lịch học, hệ thống hỗ trợ cơ chế lặp lại hàng tuần từ ngày bắt đầu đến ngày kết thúc (`startDate` -> `endDate`), tự động gán chung mã nhóm `recurrenceGroupId`.
* **Ràng buộc Ngày bắt đầu (Fix 1)**: Đảm bảo ngày bắt đầu phải khớp với Thứ đã chọn. Nếu người dùng nhập sai, form hiển thị cảnh báo đỏ nổi bật kèm nút **"Tự động sửa"** (tự nhảy đến ngày tương ứng gần nhất) và khóa nút submit. Phía máy chủ (Server Action) cũng có lớp validate thứ 2 để chặn đứng dữ liệu lệch ngày.
* **Nhóm chuỗi lịch lặp (Fix 4)**: Trên giao diện bảng, toàn bộ các ca học có cùng `recurrenceGroupId` được gộp gọn lại thành một dòng tổng hợp hiển thị khoảng thời gian (Ngày sớm nhất -> ngày muộn nhất) và số lượng ca. Người dùng có thể nhấn biểu tượng mũi tên để thu gọn/mở rộng xem chi tiết từng ngày học. Có nút xóa toàn bộ chuỗi ca học lặp lại (Group delete) thực hiện gọi action `ALL_FUTURE` từ ngày bắt đầu đầu tiên của chuỗi.

### C. Khung giờ cố định & Validation tối ưu (Fix 2 & Fix 3)
* **Dropdown giờ cố định (Fix 2)**: Thay thế ô nhập text tự do bằng thẻ `<select>` chọn các khung giờ cách nhau 30 phút. Khi đổi giờ bắt đầu, hệ thống tự động cộng thêm 90 phút vào giờ kết thúc nếu chưa chọn hoặc nếu giờ kết thúc trước giờ bắt đầu. Danh sách giờ kết thúc tự động lọc bỏ các giờ trước giờ bắt đầu.
* **Inline validation (Fix 3)**: Gỡ bỏ thuộc tính `required` của HTML5 trên toàn bộ các ô nhập để tránh lỗi tooltip đè mất layout phòng học. Thay vào đó, viết hàm validate tùy biến hiển thị inline các thông báo lỗi ngay dưới từng trường nhập liệu. Lỗi sẽ tự động ẩn đi ngay khi người dùng chọn/nhập giá trị hợp lệ.

### D. Phân quyền hiển thị & Cảnh báo xung đột (Fix 5)
* **Teacher View**: Giáo viên vẫn nhìn thấy các khung giờ bị bận bởi giáo viên khác trên lịch tuần/tháng nhưng thông tin chi tiết bị ẩn đi (tên lớp hiển thị là `"Đã bận"`, giáo viên là `"Giảng viên khác"`, phòng học và môn học hiển thị `"—"` và không thể chỉnh sửa/xóa).
* **Admin View**: Hiển thị đầy đủ chi tiết mọi lịch biểu. Nếu phát hiện trùng phòng học hoặc trùng giáo viên trong cùng khung giờ, hệ thống hiển thị **Banner cảnh báo xung đột (Overlap Warning)** ở đầu bảng danh sách để Admin kịp thời xử lý.

### E. Xóa Ca học thông minh
Hỗ trợ hai phương án xóa an toàn khi click xóa lịch lặp:
* **Chỉ xóa ca này (`ONLY_THIS`)**: Chỉ xóa bản ghi duy nhất của ngày được chọn.
* **Xóa tất cả trong tương lai (`ALL_FUTURE`)**: Xóa toàn bộ chuỗi ca học lặp lại kể từ ngày được chọn trở đi.
* **Rào chắn bảo vệ (Guard)**: Nếu đã có học sinh nộp bài tập về nhà cho ca học muốn xóa, hệ thống sẽ tự động chặn thao tác để tránh mất dữ liệu chấm điểm của lớp.

### F. Chỉnh sửa & Dịch chuyển chuỗi lặp (Update Schedule)
* Cho phép Giáo viên/Admin chuyển giao diện xem chi tiết thành form sửa trực tiếp trong modal.
* Khi chỉnh sửa chuỗi lịch lặp, hệ thống tự động tính toán số ngày lệch (`dateDiff`) để tự động tịnh tiến dịch chuyển ngày học của tất cả các ca tiếp theo trong chuỗi.
* Tích hợp kiểm tra trùng lịch (Overlap Check) an toàn cho cả phòng học, lịch giáo viên, lớp học và đưa ra cảnh báo trùng lịch học sinh nếu phát hiện xung đột thời gian.

---

## 📝 3. Hệ thống Bài tập & Tài liệu Học tập

Để tối ưu chi phí vận hành (0đ), hệ thống sử dụng phương án liên kết URL trực tiếp (Google Drive, OneDrive, Dropbox, v.v.):

### A. Đăng tải Bài học & Tài liệu học tập
* Giáo viên/Admin dán trực tiếp link tài liệu xem trước và đề bài tập về nhà vào từng ca học.
* Quyết định kiến trúc: Đường dẫn được lưu dạng `String` (phân tách bằng dấu phẩy hoặc dạng JSON list) thay vì sử dụng mảng nguyên bản của PostgreSQL (`String[]`). Điều này giúp duy trì khả năng tương thích chéo (cross-db portability), cho phép sử dụng SQLite ở môi trường phát triển cục bộ và PostgreSQL ở môi trường Live. **Dự án có kế hoạch migrate sang sử dụng kiểu dữ liệu `String[]` nguyên bản của Postgres ngay sau khi loại bỏ hoàn toàn việc hỗ trợ SQLite cục bộ.**
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
3. **Môi trường Cơ sở dữ liệu và Migration**: Tuyệt đối tránh chạy lệnh `prisma db push --accept-data-loss` trên môi trường Staging/Production để tránh nguy cơ mất mát dữ liệu live. Toàn bộ thay đổi Schema trên môi trường live bắt buộc phải được triển khai thông qua các tệp tin Migration được đánh số phiên bản (`prisma migrate dev/deploy`) để có thể rollback khi có sự cố.
4. **TypeScript & Linter**: Mọi thay đổi mã nguồn luôn phải vượt qua kiểm tra kiểu nghiêm ngặt (`tsc --noEmit`) và các quy tắc linter không có cảnh báo (`eslint src --max-warnings 0`) trước khi được deploy tự động lên production.

---

## 🔒 6. Hệ thống Đề thi Trắc nghiệm & Cơ chế Chống gian lận

Hệ thống cho phép tạo đề thi trắc nghiệm trực tuyến (tích hợp giao bài tập về nhà theo ca học) kèm các tính năng bảo mật:

### A. Công khai và Ẩn đề thi khỏi danh sách làm thử
* Đề thi được đánh dấu công khai (`isPublic: true`) cho phép thí sinh tự do vào luyện tập làm bài không cần đăng nhập.
* Admin/Giáo viên có thể tắt tùy chọn **"Hiển thị trên danh sách đề thi thử"** khi tạo đề thi. Lúc này, hệ thống sẽ đánh dấu thẻ ẩn danh `[UNLISTED]` trong phần mô tả đề thi. Đề thi sẽ tự động ẩn khỏi trang danh sách chính nhưng vẫn hoàn toàn truy cập và làm bài thi được nếu có đường dẫn (Link chia sẻ trực tiếp).

### B. Logic Tính điểm dạng câu hỏi Đúng/Sai (Dạng thức II)
Phục vụ kỳ thi THPT Quốc gia theo chương trình mới:
* Một câu hỏi Đúng/Sai có 4 ý nhỏ. Cách thức tính điểm của câu đó dựa trên số ý trả lời đúng:
  * Trả lời đúng **1 ý**: Nhận được `0.1` điểm.
  * Trả lời đúng **2 ý**: Nhận được `0.25` điểm.
  * Trả lời đúng **3 ý**: Nhận được `0.5` điểm.
  * Trả lời đúng **4 ý**: Nhận được `1.0` điểm.
* Giao diện xem lại lời giải hiển thị cụ thể số ý đúng (ví dụ: `Đúng một phần (3/4 ý) (0.50đ)`) cùng đáp án đúng và lời giải chi tiết cho từng ý.

### C. Cơ chế Chống gian lận (Anti-Cheating Room)
Nhằm duy trì tính công bằng của kỳ thi trực tuyến:
* **Phát hiện chuyển Tab hoặc rời cửa sổ (Focus Loss/Blur)**: Hệ thống giám sát qua `visibilitychange` và `window.blur`. Khi học sinh chuyển tab hoặc nhấp chuột sang ứng dụng khác ngoài trình duyệt, cảnh báo sẽ hiển thị.
  * Vi phạm quá **3 lần**: Hệ thống lập tức khóa màn hình làm bài bằng lớp phủ mờ bảo mật (ngăn mọi click chọn đáp án) và tự động gửi kết quả đã làm lên server nộp bài.
* **Chặn Sao chép & Chụp màn hình**:
  * Vô hiệu hóa thao tác sao chép, cắt, dán và nhấp chuột phải (`onCopy`, `onCut`, `onPaste`, `onContextMenu`).
  * Sử dụng CSS `select-none` chặn học sinh bôi đen văn bản để tra cứu thông tin.
  * Tích hợp lớp hình mờ bảo mật (Security Watermark) chứa thông tin của thí sinh chạy lặp lại toàn màn hình làm bài để phá hỏng hình ảnh/video quay lén từ thiết bị bên ngoài.
  * Chặn in đề thi (`Ctrl + P`) qua thuộc tính ẩn trang print.
