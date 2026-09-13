# 🎓 Dự án edu-web: Bối cảnh kỹ thuật hiện tại

Tài liệu này tóm tắt bối cảnh sản phẩm, kiến trúc, dữ liệu và các quyết định kỹ thuật quan trọng của **edu-web** để các phiên làm việc sau có thể hiểu nhanh hệ thống mà không phải đọc lại toàn bộ codebase.

---

## 1. Tổng quan sản phẩm

**edu-web** là cổng quản lý trung tâm giáo dục đa vai trò, kết hợp LMS, quản lý lớp luyện thi, lịch học, điểm danh, học phí, tài liệu và đề thi trắc nghiệm trực tuyến.

Các vai trò chính:

- `ADMIN`: quản trị toàn hệ thống, người dùng, lớp, môn, phòng, lịch, tài liệu, học phí, đề thi và bảo mật hệ thống.
- `TEACHER`: quản lý lớp được phân công, lịch dạy, điểm danh, điểm số, tài liệu, đề thi và học phí theo lớp phụ trách.
- `STUDENT`: xem lịch, điểm danh, điểm số, tài liệu, đề thi, bảng xếp hạng và thanh toán.
- `PARENT`: xem thông tin con, điểm danh/điểm số và thanh toán học phí cho con.

---

## 2. Tech stack & runtime

- **Framework**: Next.js `16.2.10` App Router, React `19.2.4`.
- **Ngôn ngữ**: TypeScript.
- **Database**: PostgreSQL.
- **ORM**: Prisma `7.8.0` dùng `@prisma/adapter-pg` + `pg.Pool`; `datasource db` trong `prisma/schema.prisma` không khai báo `url`.
- **Auth**: JWT ký bằng `jose`, lưu trong cookie `session_token` httpOnly.
- **UI/CSS**: Tailwind CSS 4, CSS globals trong `src/app/globals.css`, Lucide React icons, KaTeX cho toán học.
- **PDF/storage/integrations**: PDF.js worker được copy bằng `scripts/copy-pdf-worker.mjs`; có helper R2/Cloudinary/PDF/image upload và PayOS.
- **Testing**: Vitest cho unit tests, Playwright cho E2E.

> Lưu ý quan trọng: dự án dùng Next.js 16. Trước khi sửa API hoặc convention liên quan Next.js, đọc tài liệu tương ứng trong `node_modules/next/dist/docs/` vì behavior có thể khác các phiên bản Next cũ.

---

## 3. Cấu trúc ứng dụng cấp cao

### App Router

`src/app/` chia theo route group và dashboard:

- `src/app/(public)/`: landing page, tin tức, tài liệu công khai, tuyển sinh, trang đề thi công khai.
- `src/app/(auth)/login/`: đăng nhập theo vai trò.
- `src/app/admin/`: dashboard quản trị.
- `src/app/teacher/`: dashboard giáo viên.
- `src/app/student/`: dashboard học sinh.
- `src/app/parent/`: dashboard phụ huynh.
- `src/app/api/`: route handlers cho upload, document proxy/download, attendance APIs, teacher/admin APIs, AI quiz generation và PayOS webhook.

### Proxy / phân quyền route

`src/proxy.ts` là lớp bảo vệ route:

- Đọc JWT bằng `getMiddlewareSession()` từ `src/lib/auth.ts`.
- Chặn truy cập chưa đăng nhập vào `/admin`, `/teacher`, `/student`, `/parent`.
- Chặn cross-role dashboard access, ví dụ tài khoản `STUDENT` không vào `/admin`.
- Redirect user đã đăng nhập khỏi `/login` về dashboard tương ứng.

### Server Actions

`src/actions/` chứa phần lớn logic đọc/ghi server-side:

- `auth.ts`, `session.ts`: đăng nhập/đăng xuất và user hiện tại.
- `schedules.ts`, `calendar.ts`: lịch học và calendar events.
- `classes.ts`, `subjects.ts`, `rooms.ts`, `users.ts`: dữ liệu quản trị nền.
- `attendance.ts`, `grades.ts`, `homework.ts`: vận hành lớp học.
- `documents.ts`: tài liệu.
- `quizzes.ts`: đề thi, làm bài, chấm điểm.
- `tuition.ts`, `payment.ts`: học phí và thanh toán PayOS.
- `settings.ts`: thiết lập người dùng.

Quy tắc chung của codebase: business rules và phân quyền nên nằm ở Server Actions/route handlers, không tin dữ liệu từ client component.

---

## 4. Database model chính

Schema nằm ở `prisma/schema.prisma`.

Nhóm dữ liệu lõi:

- **Identity**: `User`, `AdminProfile`, `TeacherProfile`, `StudentProfile`, `ParentProfile`, enum `Role`.
- **Học vụ**: `Class`, `Subject`, `Course`, `Module`, `Lesson`, `Enrollment`.
- **Lịch học**:
  - `Schedule`: model lịch cũ/legacy, vẫn tồn tại để tương thích.
  - `ScheduleSeries`: chuỗi lịch học lặp theo tuần, là model chính hiện tại.
  - `ScheduleException`: ngoại lệ cho từng buổi trong chuỗi (`MODIFIED`, `CANCELLED`, có thể có `rescheduledDate`).
  - `HomeworkSubmission`: bài nộp gắn với `seriesId` + `instanceDate`.
- **Điểm danh & điểm số**: `Attendance`, `Grade`.
- **Quiz**: `Quiz`, `QuizClassAssignment`, `Question`, `QuizAttempt`, `QuizSubmission`.
- **Tài liệu**: `Document`, `DocumentClassVisibility`.
- **Calendar cá nhân/sự kiện**: `Calendar`, `Event`, `EventException`, `EventParticipant`, `Reminder`.
- **Học phí/PayOS**: `TuitionFeeSetting`, `Tuition`, `TuitionPayment`, `StudentCredit`, `PaymentLink`.

### Prisma 7/PostgreSQL note

`src/lib/db.ts` tạo `PrismaClient` với adapter:

- `DATABASE_URL` được đọc từ environment khi chạy thật.
- Có fallback mock connection string để tránh lỗi import, nhưng mọi thao tác DB thật cần PostgreSQL hợp lệ.
- File export cả `db` và `pool` để test/đo SQL round-trip khi cần.

---

## 5. Hệ thống lịch học & calendar

UI lịch hiện tại nằm trong `src/components/calendar/`, không còn `WeeklyTimetable.tsx`.

Các component chính:

- `CalendarApp.tsx`: client shell quản lý view, load calendars/events/schedules, mở modal.
- `CalendarHeader.tsx`: điều hướng ngày/view và nút tạo lịch.
- `DayView.tsx`, `WeekView.tsx`, `MonthView.tsx`, `AgendaView.tsx`: các chế độ xem.
- `ScheduleModal.tsx`: tạo/sửa lịch học.
- `SessionDetailModal.tsx`: chi tiết buổi học, bài tập, điểm danh/chấm bài tùy vai trò.
- `EventModal.tsx`: sự kiện calendar cá nhân/nhóm.

### Mô hình lịch học chính

Dự án dùng mô hình **Master + Exception** giống Google Calendar:

- `ScheduleSeries` là chuỗi gốc, lưu thứ trong tuần, giờ học, phòng, lớp, môn, giáo viên, `startDate`, `endDate`.
- `ScheduleException` lưu thay đổi cho một ngày gốc:
  - `CANCELLED`: hủy riêng buổi đó.
  - `MODIFIED`: override phòng/giờ/lớp/môn/giáo viên/bài tập hoặc dời sang `rescheduledDate`.
- `src/lib/schedule-expand.ts` expand runtime series + exceptions thành danh sách buổi hiển thị.

### Quy ước ngày giờ lịch học

- Ngày lịch học (`startDate`, `endDate`, `originalDate`, `instanceDate`) được normalize về **UTC midnight**.
- Giờ nhập dạng `HH:mm` được hiểu theo timezone cố định `Asia/Ho_Chi_Minh` khi ghép thành instant hiển thị.
- Helper quan trọng: `normalizeDateUtc`, `dateToUtcStr`, `combineDateAndTimeHcm`, `expandSeriesToInstances`.

### Tạo/sửa/xóa lịch học

`src/actions/schedules.ts` xử lý logic server-side:

- `createSchedule()`:
  - Chỉ `ADMIN`/`TEACHER`.
  - Teacher chỉ được tạo lịch cho chính mình và lớp mình phụ trách.
  - Validate `startDate` khớp `dayOfWeek`, giờ bắt đầu < giờ kết thúc.
  - Kiểm tra conflict trong window giới hạn `CONFLICT_CHECK_WINDOW_DAYS` với series vô hạn.
  - Dùng PostgreSQL advisory lock trong transaction để giảm race condition khi xếp lịch.
- `updateSchedule()` hỗ trợ 3 mode:
  - `ONLY_THIS`: tạo/cập nhật `ScheduleException` cho một buổi, có thể dời ngày bằng `rescheduledDate`.
  - `ALL_FUTURE`: cắt series cũ và tạo series mới từ ngày cutover.
  - `ALL`: cập nhật trực tiếp toàn bộ series.
- `deleteSchedule()` hỗ trợ:
  - `ONLY_THIS`: tạo exception `CANCELLED`.
  - `ALL_FUTURE`: cắt `endDate` hoặc xóa series nếu cut từ ngày đầu.

### Conflict & guard dữ liệu

Các cấp kiểm tra trùng lịch:

1. Trùng phòng.
2. Trùng giáo viên.
3. Trùng lớp.
4. Trùng học sinh giữa nhiều lớp: trả warning nếu có thể bỏ qua bằng `ignoreWarning`.

Guard quan trọng:

- Không cho xóa hoặc cắt/sửa các buổi đã có `HomeworkSubmission` ở phạm vi bị ảnh hưởng.
- Không cho dời một buổi tới ngày đã có buổi khác trong cùng series.
- Không cho dời buổi về quá khứ.

---

## 6. Calendar events độc lập

Ngoài lịch học, hệ thống có calendar events riêng:

- `Calendar`: lịch của user.
- `Event`: sự kiện có `startTime`, `endTime`, timezone, màu, trạng thái và RRULE tùy chọn.
- `EventException`: override/cancel một occurrence của event lặp.
- `EventParticipant`, `Reminder`: người tham gia và nhắc lịch.

`CalendarApp.tsx` load song song:

1. Sự kiện từ `getEvents()` theo calendar visible.
2. Lịch học từ `getSchedulesForCalendar()` theo vai trò/user/lớp.

Sự kiện calendar có thể kéo thả để đổi giờ; lịch học thì không kéo thả trực tiếp mà phải sửa qua form lịch học.

---

## 7. Quiz, mã đề và chống gian lận

Quiz nằm ở `src/actions/quizzes.ts`, logic thuần ở `src/lib/quiz-shuffle.ts`.

### Model chính

- `Quiz`: tiêu đề, thời lượng, điểm đạt, deadline mặc định, public/private, chế độ hiển thị đáp án, `shuffleQuestions`, môn/giáo viên. `classId` vẫn tồn tại để tương thích legacy và được sync theo lớp đầu tiên khi tạo/sửa đề mới.
- `QuizClassAssignment`: model giao đề chính hiện tại, nối `Quiz` với nhiều `Class`; mỗi dòng có thể override `deadlineOverride` và `startsAtOverride` theo lớp.
- `Question`: câu hỏi, loại câu, options JSON, đáp án đúng, điểm, lời giải, ảnh.
- `QuizAttempt`: mỗi lượt làm bài/mã đề, lưu `examCode`, `layout`, `startsAt`, `endsAt`, status.
- `QuizSubmission`: bài nộp, điểm, answers JSON, guest name, late flag, link tới attempt.

### Giao đề theo lớp

- Giáo viên/admin có thể giao một đề cho nhiều lớp qua `QuizClassAssignment`.
- Effective deadline = `assignment.deadlineOverride ?? quiz.deadline`; deadline không chặn nộp/bắt đầu, chỉ đánh dấu `isLate` và có thể mở đáp án theo policy.
- Effective startsAt = `assignment.startsAtOverride`; nếu ở tương lai thì `startQuizAttempt()` chặn server-side bằng thông báo “Đề thi chưa mở cho lớp của bạn.”
- Private quiz có assignment yêu cầu học sinh thuộc ít nhất một lớp được gán; nếu học sinh thuộc nhiều lớp gán cùng đề, hệ thống chọn assignment deterministic theo deadline override sớm nhất rồi `classId`.
- `AFTER_ALL_SUBMITTED` được tính theo lớp hiệu lực của học sinh, không chờ tất cả lớp được gán cùng đề.

### Luồng làm bài hiện tại

1. `startQuizAttempt()`:
   - Kiểm tra quyền truy cập đề.
   - Với đề private gắn lớp, học sinh phải thuộc lớp.
   - Tạo layout xáo trộn bằng `generatePaper()`.
   - Tạo `QuizAttempt` với `examCode` 4 ký tự và `endsAt` theo duration.
   - Trả về paper questions **không chứa `correctAnswer`/`explanation`**.
2. `submitQuiz()`:
   - Nếu có `attemptId`, chấm bằng `gradeWithLayout()` để map đáp án display → original.
   - Nếu attempt đã quá giờ, status thành `TIMED_OUT`, submission đánh dấu late.
   - Tạo `QuizSubmission`; nếu là học sinh đăng nhập thì ghi thêm `Grade`.
   - Quyết định trả đáp án dựa trên `answerVisibility`.

### Loại câu và chấm điểm

- `MULTIPLE_CHOICE`: so đáp án theo option index/display index.
- `TRUE_FALSE`: hỗ trợ 4 ý, thang điểm:
  - đúng 1 ý: 10% điểm câu.
  - đúng 2 ý: 25%.
  - đúng 3 ý: 50%.
  - đúng 4 ý: 100%.
- `SHORT_ANSWER`: giữ nguyên chuỗi đáp án.

### Anti-cheating phía UI

Trang làm bài client giám sát rời tab/window và các thao tác copy/paste/context menu trong public/single quiz player. Server vẫn là nguồn chân lý cho mã đề, layout và `endsAt`; không dựa vào client để giữ đáp án bí mật.

---

## 8. Tài liệu, bài tập và file

### Tài liệu

- `Document` lưu metadata file: title, description, URL, file name/type/size, category, published, creator.
- `DocumentClassVisibility` giới hạn tài liệu theo lớp.
- `createdById` là `TeacherProfile.id`; `null` nghĩa là tài liệu hệ thống/admin.
- Teacher chỉ nên thao tác tài liệu mình tạo; Admin có quyền rộng hơn.

### Bài tập theo lịch học

- Bài tập gắn trực tiếp vào `ScheduleSeries` hoặc override qua `ScheduleException`: `materials`, `homework`, `homeworkDueDate`, `homeworkQuizId`.
- `HomeworkSubmission` gắn với `seriesId`, `instanceDate`, `studentId` và lưu `fileUrl`, `fileName`, `submittedAt`, `grade`, `feedback`.
- Khi chấm bài tập, điểm có thể đồng bộ sang `Grade` qua quan hệ 1-1 `homeworkSubmissionId`.

### Upload/proxy

`src/app/api/` có route handlers cho upload ảnh/tài liệu, proxy/download tài liệu và tài liệu VIP. Storage cụ thể phụ thuộc environment provider keys.

---

## 9. Học phí & PayOS

Các model chính:

- `TuitionFeeSetting`: đơn giá mỗi buổi/tiết.
- `Tuition`: khoản phải thu theo học sinh, lớp, tháng/năm, số buổi, amount, paid, status.
- `TuitionPayment`: lịch sử thanh toán, method `CASH`/`TRANSFER`/`PAYOS`, `payosReference` unique để chống webhook trùng.
- `StudentCredit`: dư/nợ tiết theo học sinh-lớp.
- `PaymentLink`: link PayOS theo `orderCode`, status `PENDING`/`PAID`/`CANCELLED`, checkout URL/QR, month/year fallback.

Luồng PayOS:

- `src/actions/payment.ts`:
  - `createPaymentLink()` cho `STUDENT`/`PARENT`, kiểm tra ownership, số tiền còn thiếu, cấu hình PayOS, tạo link 30 phút.
  - `checkPaymentStatus()` poll PayOS và reconcile nếu webhook chậm.
- `src/lib/payos-reconcile.ts`: áp dụng thanh toán thành công vào DB, xử lý fallback khi `tuitionId` bị null/xóa.
- `src/app/api/webhooks/payos/route.ts`: nhận webhook PayOS.

---

## 10. Seed data và tài khoản demo

`prisma/seed.ts` tạo dữ liệu demo deterministic cho test và staging/dev.

Mật khẩu mặc định cho đa số user seed: `Test@1234`.

Tài khoản root admin seed:

- Email: `admin@eduweb.vn`
- Password: `hungcuong123`
- `isRoot = true`

Một số email seed đáng chú ý:

- `teacher.toan@eduweb.vn`
- `parent1@eduweb.vn`
- `student1@eduweb.vn`

Seed cố tình chứa nhiều edge case để viết test:

- ScheduleSeries vô hạn, đã kết thúc, trùng lịch giáo viên/phòng.
- ScheduleException `MODIFIED`, `CANCELLED`, `rescheduledDate`.
- Homework đúng hạn, trễ hạn, chưa chấm, đã sync Grade.
- Attendance absent streak, excused trong tháng có tuition paid.
- Quiz quá deadline, public guest quiz, private/class quiz.
- Tuition partial/paid/pending, PayOS duplicate reference, payment link paid nhưng `tuitionId = null`.
- Document published restricted, unpublished, admin/system document.
- Calendar recurring event + exceptions.
- Optional/null relations như lớp chưa có GVCN, học sinh chưa có phụ huynh, môn chưa có giáo viên.

---

## 11. Testing & verification

### Unit tests

Vitest config ở `vitest.config.ts`:

- Environment: `node`.
- Setup: `tests/setup.ts`.
- Exclude: `node_modules`, build/cache/git folders, `.claude/**`, `e2e/**/*`.
- Coverage include: `src/actions/**`, `src/lib/**`.

`tests/setup.ts` mock:

- `@/lib/auth` (`getSession`).
- `next/cache` (`revalidatePath`).
- `@/lib/db` (`mockDb`) để unit tests không chạm DB thật mặc định.

Unit tests hiện có tập trung ở `src/lib/**/*.test.ts` và `src/lib/__tests__/`.

### E2E tests

Playwright config ở `playwright.config.ts`:

- `testDir: ./e2e`.
- Projects: `setup`, `chromium`, `firefox`, `mobile-chrome`, `mobile-safari`.
- Browser projects phụ thuộc `setup`, tức `e2e/auth.setup.ts` chạy trước.
- Local webServer chạy `npm run dev` với `.env.test`, URL `http://localhost:3000`, reuse server nếu có.

Các E2E spec bao phủ smoke, auth/RBAC, responsive, payment, PDF region, schedule UI, quiz demo/visibility/anti-cheat/no-404.

### Lệnh thường dùng

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

```bash
npm run test:types
```

```bash
npm run test:unit
```

```bash
npm run test:unit -- src/lib/__tests__/quiz-shuffle.test.ts
```

```bash
npm run test:e2e
```

```bash
npx playwright test e2e/quiz-anticheat.spec.ts --project=chromium
```

```bash
npx prisma generate
```

```bash
npx prisma db seed
```

---

## 12. Quy tắc an toàn vận hành

- Không chạy `prisma db push --accept-data-loss` trên staging/production.
- Thay đổi schema live phải đi qua migration trong `prisma/migrations/`.
- Các thao tác xóa dữ liệu học vụ cần kiểm tra quan hệ phụ thuộc, đặc biệt homework submissions, grades, tuition/payment links.
- Không tin dữ liệu từ client đối với auth, role, ownership, quiz answers/layout, payment status.
- Với lịch học, mọi sửa/xóa phạm vi chuỗi phải xét `ScheduleException` và `HomeworkSubmission` để tránh mất dữ liệu.
- Với PayOS, dùng `payosReference`/`orderCode` để chống xử lý trùng webhook.

---

## 13. Ghi chú về tài liệu cũ

Các ghi chú cũ từng nhắc `WeeklyTimetable.tsx`, hỗ trợ SQLite local, hoặc chỉ dùng `Schedule.recurrenceGroupId` là đã lỗi thời so với code hiện tại. Model chính của lịch học hiện là `ScheduleSeries` + `ScheduleException`, UI lịch nằm dưới `src/components/calendar/`, và data layer hiện dùng Prisma 7 với PostgreSQL adapter.
