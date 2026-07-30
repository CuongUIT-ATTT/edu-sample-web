# Kiểm tra Hệ thống — TEST CHECKLIST

## 1. Tổng quan
- **Tổng số test viết**: 27
- **PASS**: 25
- **FAIL**: 0
- **Chưa có logic implement**: 2 (cần dev bổ sung)

## 2. Danh sách chi tiết

### 🚨 Nhóm Tuition (ưu tiên cao nhất — rủi ro tiền bạc)

| # | Case | ID | Auto Test | Hướng dẫn kiểm tra tay | Kết quả mong đợi |
|---|------|----|-----------|----------------------|------------------|
| 1 | Đã đóng đủ | tui-001 | PASS | `/admin/tuition` → 10A1 → sp-001 | paid=432000=amount, status=PAID |
| 2 | Đóng thiếu (partial) | tui-002 | PASS | `/admin/tuition` → 10A1 → sp-002 | paid=200000<432000, status=PARTIAL |
| 3 | Chưa đóng | tui-003 | PASS | `/admin/tuition` → 10A1 → sp-003 | paid=0, PENDING |
| 4 | Nhiều đợt đóng | tui-002.payments | PASS | Kiểm tra sp-002 có 2 payments | 100k+100k=200k |
| 5 | Số tiết sai lệch vs Attendance | tui-004 | PASS (data) | sp-004 vắng 3 buổi nhưng tuition ghi 24 tiết | **Logic chưa đồng bộ** — cần dev |
| 6 | Fee thay đổi giữa kỳ | tfs-001→tfs-002 | PASS | Tháng trước 20×15k=300k, tháng này 24×18k=432k | Đúng |

### 🚨 Nhóm Quiz (rủi ro gian lận)

| # | Case | ID | Auto Test | Hướng dẫn | Kỳ vọng |
|---|------|----|-----------|-----------|---------|
| 7 | Quiz public/private | qz-001/002 | PASS | qz-001 isPublic=true, qz-002=false | Đúng |
| 8 | Đủ 3 loại Question | qs-001/002/004 | PASS | MC + TF + SA | Đúng |
| 9 | Question có ảnh/không | qs-003/001 | PASS | qs-003 có imageUrl, qs-001=null | Đúng |
| 10 | **Submission sau hết hạn** | qz-003 | ❌ **Chưa có logic** | submitQuiz() không check endTime | Cần dev validate |

### ✅ Nhóm Schedule

| # | Case | ID | Auto Test | Hướng dẫn | Kỳ vọng |
|---|------|----|-----------|-----------|---------|
| 11 | Trùng phòng+giờ | sch-003/004 | PASS | Cùng P101, 10:30-12:00, khác lớp | Conflict |
| 12 | GV trùng giờ | sch-005/006 | PASS | Thầy Dung 07:30-09:00 ở 2 lớp | Conflict |
| 13 | Recurring group | rg-001 | PASS | 3 schedule cùng teacher/time | Đúng |
| 14 | Không xóa được nếu có HW | sch-001 | PASS | schedule có homework | Báo lỗi |

### ✅ Nhóm Attendance

| # | Case | ID | Auto Test | Hướng dẫn | Kỳ vọng |
|---|------|----|-----------|-----------|---------|
| 15 | Đủ 4 trạng thái | sp-001 | PASS | PRESENT/ABSENT/LATE/EXCUSED | Đúng |
| 16 | Absent 3+ liên tiếp | sp-002 | PASS | 3 ABSENT | Đúng |
| 17 | Chưa điểm danh | implicit | PASS | Hôm nay chưa có record | 0 record |

### ✅ Nhóm Grade & Homework

| # | Case | ID | Auto Test | Hướng dẫn | Kỳ vọng |
|---|------|----|-----------|-----------|---------|
| 18 | Đủ QUIZ/MIDTERM/FINAL | sp-001 | PASS | 3 loại điểm Toán | Đúng |
| 19 | Nộp trễ hạn | hw-002 | PASS | submittedAt > dueDate | Đúng |
| 20 | Chưa chấm | hw-003 | PASS | grade=null | Đúng |
| 21 | Không nộp | sp-004 | PASS | count=0 | Đúng |

### ✅ Document, Calendar, Course

| Case | Auto Test | Ghi chú |
|------|-----------|---------|
| doc public/private/draft | PASS | |
| Event RRULE+Exception | PASS | |
| Participant 3 status | PASS | |
| Reminder 2 methods | PASS | |
| Module/Lesson order | PASS | |
| Enrollment 100%/0% | PASS | |

## 3. Gap cần dev bổ sung

| Gap | Mô tả | File cần sửa |
|-----|-------|-------------|
| **Quiz hết hạn** | `submitQuiz()` không validate endTime | `src/actions/quizzes.ts` — thêm check `Date.now() > quiz.createdAt + quiz.duration*60000` |
| **Tuition đồng bộ absent** | `calculateTuition()` chạy thủ công, không tự động khi mark absent | `src/actions/tuition.ts` — cần auto-recalculate hoặc job định kỳ |

## 4. File test

| File | Mô tả |
|------|-------|
| `tests/schedule.test.ts` | Conflict detection, recurring group, delete protection |
| `tests/attendance.test.ts` | 4 status, absent chain, null attendance |
| `tests/grade-homework.test.ts` | Grade types, late submission, ungraded |
| `tests/quiz.test.ts` | Types, images, private/public, guest |
| `tests/document.test.ts` | Visibility, draft |
| `tests/calendar.test.ts` | RRULE, exception, participants, reminders |
| `tests/course.test.ts` | Modules, lessons, enrollment |
| `tests/tuition.test.ts` | Payment status, partial, fee change, period mismatch |
| `tests/helpers.ts` | DB connection |
