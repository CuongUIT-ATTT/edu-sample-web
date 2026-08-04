import { describe, it, expect } from "vitest";
import {
  expandSeriesToInstances,
  normalizeDateUtc,
  dateToUtcStr,
  CONFLICT_CHECK_WINDOW_DAYS,
  combineDateAndTimeHcm,
  type SeriesLike,
  type ExceptionLike,
} from "@/lib/schedule-expand";

// Helper: tạo 1 series tối thiểu
function makeSeries(overrides: Partial<SeriesLike> = {}): SeriesLike {
  return {
    id: "series-1",
    classId: "class-1",
    subjectId: "subj-1",
    teacherId: "teacher-1",
    dayOfWeek: 2, // Thứ 3
    startTime: "08:00",
    endTime: "09:30",
    room: "Room 101",
    startDate: normalizeDateUtc("2026-08-01"), // Thứ 7
    endDate: null,
    materials: null,
    homework: null,
    homeworkDueDate: null,
    homeworkQuizId: null,
    ...overrides,
  };
}

const utc = (s: string) => normalizeDateUtc(s);
const str = (d: Date) => dateToUtcStr(d);

describe("normalizeDateUtc / dateToUtcStr", () => {
  it("chuẩn hóa string YYYY-MM-DD về UTC midnight (không lệch timezone)", () => {
    const d = normalizeDateUtc("2026-08-04");
    expect(str(d)).toBe("2026-08-04");
    // UTC midnight → đúng 3 thành phần 0
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("nhận Date không đúng UTC-midnight và ép về UTC midnight (giữ nguyên ngày UTC)", () => {
    // Date local 08:30 → normalize giữ ngày theo UTC, không theo local
    const d = new Date("2026-08-04T08:30:00.000Z");
    const norm = normalizeDateUtc(d);
    expect(str(norm)).toBe("2026-08-04");
  });

  it("throw khi input không hợp lệ", () => {
    expect(() => normalizeDateUtc("not-a-date")).toThrow();
  });

  it("CONFLICT_CHECK_WINDOW_DAYS ≈ 6 tháng", () => {
    expect(CONFLICT_CHECK_WINDOW_DAYS).toBe(182);
  });
});

describe("expandSeriesToInstances — series có endDate", () => {
  const series = makeSeries({
    dayOfWeek: 2, // Thứ 3
    startDate: utc("2026-08-03"), // Thứ 2 (dịch lên Thứ 3 đầu tiên = 04/08)
    endDate: utc("2026-08-18"), // Thứ 3
  });

  it("sinh đúng số buổi trong khoảng [from, to]", () => {
    // Các Thứ 3 trong 04/08..18/08: 04, 11, 18 → 3 buổi
    const instances = expandSeriesToInstances(series, [], utc("2026-08-01"), utc("2026-08-31"));
    expect(instances.map((i) => str(i.instanceDate))).toEqual([
      "2026-08-04",
      "2026-08-11",
      "2026-08-18",
    ]);
  });

  it("không sinh buổi trước startDate hay sau endDate", () => {
    const instances = expandSeriesToInstances(series, [], utc("2026-08-01"), utc("2026-08-31"));
    for (const i of instances) {
      expect(i.instanceDate >= series.startDate!).toBe(true);
      expect(i.instanceDate <= series.endDate!).toBe(true);
    }
  });

  it("không vượt toDate khi endDate xa hơn toDate", () => {
    const wide = makeSeries({ endDate: null }); // vô hạn
    const instances = expandSeriesToInstances(wide, [], utc("2026-08-01"), utc("2026-08-31"));
    for (const i of instances) {
      expect(i.instanceDate <= utc("2026-08-31")).toBe(true);
    }
  });
});

describe("expandSeriesToInstances — series vô hạn (endDate null)", () => {
  const infinite = makeSeries({ dayOfWeek: 3, startDate: utc("2026-08-01"), endDate: null });

  it("expand đến toDate (không giới hạn trên)", () => {
    const instances = expandSeriesToInstances(infinite, [], utc("2026-08-01"), utc("2026-08-31"));
    // Thứ 4 trong 01/08..31/08
    expect(instances.length).toBeGreaterThan(0);
    for (const i of instances) {
      expect(i.instanceDate >= utc("2026-08-01")).toBe(true);
      expect(i.instanceDate <= utc("2026-08-31")).toBe(true);
      expect(i.instanceDate.getUTCDay()).toBe(3);
    }
  });

  it("trả về [] khi toDate < startDate", () => {
    const instances = expandSeriesToInstances(infinite, [], utc("2026-08-31"), utc("2026-08-31"));
    // startDate 01/08 (Thứ 7); ngày Thứ 4 đầu tiên >= 31/08 là 02/09 > toDate → rỗng
    expect(instances).toEqual([]);
  });
});

describe("expandSeriesToInstances — exception", () => {
  const series = makeSeries({ dayOfWeek: 2, startDate: utc("2026-08-03"), endDate: null });

  it("exception CANCELLED → bỏ qua đúng ngày đó", () => {
    const exceptions: ExceptionLike[] = [
      { originalDate: utc("2026-08-11"), status: "CANCELLED" },
    ];
    const instances = expandSeriesToInstances(series, exceptions, utc("2026-08-01"), utc("2026-08-31"));
    const dates = instances.map((i) => str(i.instanceDate));
    expect(dates).toContain("2026-08-04");
    expect(dates).toContain("2026-08-18");
    expect(dates).not.toContain("2026-08-11");
  });

  it("exception MODIFIED → override các field, giữ nguyên field không override", () => {
    const exceptions: ExceptionLike[] = [
      { originalDate: utc("2026-08-11"), status: "MODIFIED", room: "Room 999", startTime: "10:00" },
    ];
    const instances = expandSeriesToInstances(series, exceptions, utc("2026-08-01"), utc("2026-08-31"));

    const modified = instances.find((i) => str(i.instanceDate) === "2026-08-11")!;
    expect(modified.isModified).toBe(true);
    expect(modified.room).toBe("Room 999");
    expect(modified.startTime).toBe("10:00");
    expect(modified.endTime).toBe("09:30"); // giữ nguyên từ series
    expect(modified.classId).toBe("class-1");

    const normal = instances.find((i) => str(i.instanceDate) === "2026-08-04")!;
    expect(normal.isModified).toBe(false);
    expect(normal.room).toBe("Room 101");
  });

  it("không có exception → giữ nguyên giá trị series", () => {
    const instances = expandSeriesToInstances(series, [], utc("2026-08-01"), utc("2026-08-31"));
    for (const i of instances) {
      expect(i.isModified).toBe(false);
      expect(i.room).toBe("Room 101");
      expect(i.startTime).toBe("08:00");
    }
  });
});

describe("expandSeriesToInstances — filter from/to", () => {
  const series = makeSeries({ dayOfWeek: 2, startDate: utc("2026-08-03"), endDate: null });

  it("chỉ trả instance trong [from, to]", () => {
    const instances = expandSeriesToInstances(series, [], utc("2026-08-10"), utc("2026-08-17"));
    const dates = instances.map((i) => str(i.instanceDate));
    // 04/08 trước from → loại; 11/08, 18/08 trong → 18/08 sau to 17/08 → chỉ còn 11/08
    expect(dates).toEqual(["2026-08-11"]);
  });

  it("tôn trọng startDate của series khi fromDate sớm hơn", () => {
    const lateStart = makeSeries({ dayOfWeek: 2, startDate: utc("2026-08-18"), endDate: null });
    const instances = expandSeriesToInstances(lateStart, [], utc("2026-08-01"), utc("2026-08-31"));
    const dates = instances.map((i) => str(i.instanceDate));
    expect(dates[0]).toBe("2026-08-18"); // không sinh buổi trước startDate
  });
});

describe("expandSeriesToInstances — nhiều instance 1 ngày", () => {
  it("mỗi ngày chỉ sinh đúng 1 instance (không dedup cần thiết)", () => {
    const series = makeSeries({ dayOfWeek: 2, startDate: utc("2026-08-03"), endDate: null });
    const instances = expandSeriesToInstances(series, [], utc("2026-08-01"), utc("2026-08-31"));
    const counts = new Map<string, number>();
    for (const i of instances) {
      const k = str(i.instanceDate);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    for (const [_, c] of counts) {
      expect(c).toBe(1);
    }
  });
});

describe("combineDateAndTimeHcm — fix timezone +7h", () => {
  const utcMidnight = (s: string) => normalizeDateUtc(s);

  it("07:00 ngày 04/08 → 2026-08-04T00:00:00.000Z (không +7h, bất kể Node TZ)", () => {
    const result = combineDateAndTimeHcm(utcMidnight("2026-08-04"), "07:00");
    // Asia/Ho_Chi_Minh 07:00 = UTC 00:00 cùng ngày
    expect(result.toISOString()).toBe("2026-08-04T00:00:00.000Z");
  });

  it("case biên giờ trễ 23:30 → 2026-08-04T16:30:00.000Z (không off-by-one ngày)", () => {
    const result = combineDateAndTimeHcm(utcMidnight("2026-08-04"), "23:30");
    // Asia/Ho_Chi_Minh 23:30 = UTC 16:30 CÙNG ngày (không nhảy sang 05/08)
    expect(result.toISOString()).toBe("2026-08-04T16:30:00.000Z");
  });

  it("giờ trước 07:00 (VD 06:00) vẫn cùng ngày", () => {
    const result = combineDateAndTimeHcm(utcMidnight("2026-08-04"), "06:00");
    expect(result.toISOString()).toBe("2026-08-03T23:00:00.000Z");
  });

  it("nhận Date không đúng UTC-midnight vẫn chuẩn hóa đúng ngày", () => {
    const d = new Date("2026-08-04T15:00:00.000Z"); // UTC 15:00 = HCM 22:00 cùng ngày
    const result = combineDateAndTimeHcm(d, "07:00");
    expect(result.toISOString()).toBe("2026-08-04T00:00:00.000Z");
  });
});

describe("expandSeriesToInstances — reschedule (dời ngày buổi)", () => {
  const series = makeSeries({ dayOfWeek: 2, startDate: utc("2026-08-03"), endDate: null });

  it("MODIFIED + rescheduledDate → buổi gốc biến mất, buổi mới sinh tại ngày dời", () => {
    const exceptions: ExceptionLike[] = [
      {
        originalDate: utc("2026-08-11"),
        status: "MODIFIED",
        rescheduledDate: utc("2026-08-14"), // Thứ 6 — ngoài lưới Thứ 3 của series
        room: "Room 999",
        startTime: "10:00",
      },
    ];
    const instances = expandSeriesToInstances(series, exceptions, utc("2026-08-01"), utc("2026-08-31"));
    const dates = instances.map((i) => dateToUtcStr(i.instanceDate));
    // Buổi gốc 11/08 không còn
    expect(dates).not.toContain("2026-08-11");
    // Buổi dời 14/08 xuất hiện với override
    expect(dates).toContain("2026-08-14");
    const moved = instances.find((i) => dateToUtcStr(i.instanceDate) === "2026-08-14")!;
    expect(moved.isModified).toBe(true);
    expect(moved.room).toBe("Room 999");
    expect(moved.startTime).toBe("10:00");
    // Các buổi Thứ 3 khác giữ nguyên
    expect(dates).toContain("2026-08-04");
    expect(dates).toContain("2026-08-18");
  });

  it("buổi dời trùng ngày với instance gốc khác → buổi dời thắng (1 instance duy nhất)", () => {
    // Dời 11/08 (Thứ 3) sang 18/08 (Thứ 3 tuần sau — vốn đã có instance)
    const exceptions: ExceptionLike[] = [
      { originalDate: utc("2026-08-11"), status: "MODIFIED", rescheduledDate: utc("2026-08-18") },
    ];
    const instances = expandSeriesToInstances(series, exceptions, utc("2026-08-01"), utc("2026-08-31"));
    const dates = instances.map((i) => dateToUtcStr(i.instanceDate));
    // 18/08 chỉ có 1 instance (buổi dời thắng, không trùng)
    expect(dates.filter((d) => d === "2026-08-18")).toHaveLength(1);
    // 11/08 biến mất
    expect(dates).not.toContain("2026-08-11");
  });

  it("rescheduledDate ngoài [from, to] → không sinh buổi dời", () => {
    const exceptions: ExceptionLike[] = [
      { originalDate: utc("2026-08-11"), status: "MODIFIED", rescheduledDate: utc("2026-09-01") },
    ];
    const instances = expandSeriesToInstances(series, exceptions, utc("2026-08-01"), utc("2026-08-31"));
    const dates = instances.map((i) => dateToUtcStr(i.instanceDate));
    expect(dates).not.toContain("2026-09-01");
    expect(dates).not.toContain("2026-08-11"); // buổi gốc vẫn bị skip dù dời ngoài window
  });
});
