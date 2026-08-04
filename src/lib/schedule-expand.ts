/**
 * Runtime expansion of ScheduleSeries → concrete occurrences (instances).
 *
 * Mô hình "Master + Exception" kiểu Google Calendar:
 * - ScheduleSeries = chuỗi lặp gốc (master). KHÔNG lưu từng occurrence vật lý.
 * - ScheduleException = ngoại lệ cho 1 buổi cụ thể (MODIFIED = sửa, CANCELLED = hủy).
 * - Instance hiển thị trên calendar được TÍNH RUNTIME qua expandSeriesToInstances.
 *
 * Quy ước ngày (fix timezone — toàn bộ hệ thống dùng chung 2 hàm dưới đây):
 * - Mọi instanceDate / originalDate / startDate / endDate được ép về **UTC midnight**
 *   tại đúng 1 chỗ duy nhất là normalizeDateUtc(). Không ai tự `new Date("YYYY-MM-DD")`
 *   rải rác trong codebase nữa (tránh lệch +7h kiểu cũ).
 * - Mọi so sánh ngày → so bằng date string "YYYY-MM-DD" qua dateToUtcStr().
 */
import { fromZonedTime } from "date-fns-tz";

/** Múi giờ cố định của lịch học — giờ nhập "HH:MM" là giờ Việt Nam, không phụ thuộc TZ của Node process. */
export const SCHEDULE_TZ = "Asia/Ho_Chi_Minh";

/**
 * Ghép 1 ngày (UTC-midnight) với 1 giờ "HH:MM" → instant đúng theo Asia/Ho_Chi_Minh,
 * bất kể Node process chạy TZ nào. Fix lệch +7h (trên Vercel Node TZ=UTC, setHours(7) tạo 07:00Z → client +7 render 14:00).
 */
export function combineDateAndTimeHcm(date: Date, timeStr: string): Date {
  const dateStr = dateToUtcStr(date);
  return fromZonedTime(`${dateStr} ${timeStr}`, SCHEDULE_TZ);
}

/** Window check trùng lịch cho series vô hạn (không thể check "vĩnh viễn"). Dùng chung ở createSchedule / ALL_FUTURE / ALL. */
export const CONFLICT_CHECK_WINDOW_DAYS = 182; // ~6 tháng

/** Ép 1 ngày về UTC midnight của date string YYYY-MM-DD. Input là string "YYYY-MM-DD" hoặc Date. */
export function normalizeDateUtc(input: string | Date): Date {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date input: ${String(input)}`);
  }
  // Lấy theo UTC để luôn khớp cách lưu `new Date("YYYY-MM-DD")` (UTC midnight), không lệch timezone local.
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Đổi 1 Date về date string "YYYY-MM-DD" theo UTC. Dùng để so sánh ngày (không so Date trực tiếp). */
export function dateToUtcStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** dayOfWeek 1=Mon..7=Sun → JS getDay() 0=Sun..6=Sat. */
export function dowToJsDay(dayOfWeek: number): number {
  return dayOfWeek === 7 ? 0 : dayOfWeek;
}

/** JS getDay() 0=Sun..6=Sat → dayOfWeek 1=Mon..7=Sun. */
export function jsDayToDow(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/** Ngày đầu tiên >= fromDate mà có dayOfWeek = targetDow. */
export function getNextDayOfWeek(fromDate: Date, targetDow: number): Date {
  const start = normalizeDateUtc(fromDate);
  const jsTarget = dowToJsDay(targetDow);
  const diff = (jsTarget - start.getUTCDay() + 7) % 7;
  const result = new Date(start);
  result.setUTCDate(start.getUTCDate() + diff);
  return result;
}

export interface ScheduleInstance {
  seriesId: string;
  instanceDate: Date; // UTC midnight
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  materials: string | null;
  homework: string | null;
  homeworkDueDate: Date | null;
  homeworkQuizId: string | null;
  /** true nếu instance này là exception MODIFIED (đã được override). */
  isModified: boolean;
}

/** Kiểu tối thiểu mà expandSeriesToInstances cần từ row ScheduleSeries. */
export interface SeriesLike {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  startDate: Date;
  endDate: Date | null;
  materials: string | null;
  homework: string | null;
  homeworkDueDate: Date | null;
  homeworkQuizId: string | null;
}

/** Kiểu tối thiểu mà expandSeriesToInstances cần từ row ScheduleException. */
export interface ExceptionLike {
  originalDate: Date;
  status: "MODIFIED" | "CANCELLED";
  classId?: string | null;
  subjectId?: string | null;
  teacherId?: string | null;
  room?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  materials?: string | null;
  homework?: string | null;
  homeworkDueDate?: Date | null;
  homeworkQuizId?: string | null;
}

/**
 * Sinh các instance (occurrence thật) của 1 series trong khoảng [fromDate, toDate],
 * áp dụng exception nếu có. Mỗi ngày chỉ sinh đúng 1 instance → không cần dedup.
 *
 * - Quét từ max(series.startDate, fromDate) tới min(series.endDate ?? ∞, toDate),
 *   pick ngày khớp series.dayOfWeek.
 * - Exception CANCELLED → bỏ qua ngày đó.
 * - Exception MODIFIED → merge override (field nào có giá trị thì override, null giữ nguyên).
 * - Không có exception → dùng nguyên giá trị series.
 *
 * Input dates có thể là Date không đúng UTC-midnight; hàm tự normalize. Không mutate input.
 */
export function expandSeriesToInstances(
  series: SeriesLike,
  exceptions: ExceptionLike[],
  fromDate: Date,
  toDate: Date
): ScheduleInstance[] {
  const from = normalizeDateUtc(fromDate);
  const to = normalizeDateUtc(toDate);
  const seriesStart = normalizeDateUtc(series.startDate);
  const seriesEnd = series.endDate ? normalizeDateUtc(series.endDate) : null;

  const start = from > seriesStart ? from : seriesStart;
  if (to < start) return [];

  // Map exception theo date string để tra cứu O(1)
  const excByDate = new Map<string, ExceptionLike>();
  for (const exc of exceptions) {
    const key = dateToUtcStr(normalizeDateUtc(exc.originalDate));
    excByDate.set(key, exc);
  }

  const instances: ScheduleInstance[] = [];
  const jsDay = dowToJsDay(series.dayOfWeek);

  // Dịch start lên đúng ngày khớp dayOfWeek (>= start)
  const first = new Date(start);
  const firstDiff = (jsDay - first.getUTCDay() + 7) % 7;
  if (firstDiff > 0) first.setUTCDate(first.getUTCDate() + firstDiff);

  const cur = first;
  while (cur <= to) {
    if (seriesEnd && cur > seriesEnd) break;

    const dateStr = dateToUtcStr(cur);
    const exc = excByDate.get(dateStr);

    if (exc && exc.status === "CANCELLED") {
      // bỏ qua ngày này
    } else {
      const isModified = !!exc && exc.status === "MODIFIED";
      instances.push({
        seriesId: series.id,
        instanceDate: new Date(cur),
        classId: exc?.classId ?? series.classId,
        subjectId: exc?.subjectId ?? series.subjectId,
        teacherId: exc?.teacherId ?? series.teacherId,
        dayOfWeek: series.dayOfWeek,
        startTime: exc?.startTime ?? series.startTime,
        endTime: exc?.endTime ?? series.endTime,
        room: exc?.room !== undefined ? exc.room : series.room,
        materials: exc?.materials !== undefined ? exc.materials : series.materials,
        homework: exc?.homework !== undefined ? exc.homework : series.homework,
        homeworkDueDate:
          exc?.homeworkDueDate !== undefined ? exc.homeworkDueDate : series.homeworkDueDate,
        homeworkQuizId:
          exc?.homeworkQuizId !== undefined ? exc.homeworkQuizId : series.homeworkQuizId,
        isModified,
      });
    }

    cur.setUTCDate(cur.getUTCDate() + 7);
  }

  return instances;
}
