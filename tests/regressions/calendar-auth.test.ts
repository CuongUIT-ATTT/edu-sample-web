import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "@/lib/auth";
import { mockDb } from "../setup";
import {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getSchedulesForCalendar,
} from "@/actions/calendar";

describe("P0 - Calendar Authorization Regression Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session & Cross-User Checks on Calendar", () => {
    it("getCalendars ném lỗi Unauthorized khi không có session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      await expect(getCalendars("user-1")).rejects.toThrow("Unauthorized");
    });

    it("getCalendars ném lỗi Forbidden khi client truyền userId khác với session.userId", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      await expect(getCalendars("user-hacker")).rejects.toThrow("Forbidden");
    });

    it("createCalendar ném lỗi Unauthorized khi không có session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      await expect(createCalendar({ name: "Lịch mới" }, "user-1")).rejects.toThrow("Unauthorized");
    });

    it("createCalendar ném lỗi Forbidden khi client truyền userId khác session", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      await expect(createCalendar({ name: "Lịch mới" }, "user-2")).rejects.toThrow("Forbidden");
    });

    it("updateCalendar ném lỗi khi sửa lịch không thuộc quyền sở hữu của mình", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      mockDb.calendar.findFirst.mockResolvedValue(null);

      await expect(updateCalendar("cal-other", { name: "Hack Name" })).rejects.toThrow("Calendar not found");
      expect(mockDb.calendar.findFirst).toHaveBeenCalledWith({
        where: { id: "cal-other", ownerId: "user-1" },
      });
      expect(mockDb.calendar.update).not.toHaveBeenCalled();
    });

    it("deleteCalendar ném lỗi khi xóa lịch không thuộc quyền sở hữu của mình", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      mockDb.calendar.findFirst.mockResolvedValue(null);

      await expect(deleteCalendar("cal-other")).rejects.toThrow("Calendar not found");
      expect(mockDb.calendar.delete).not.toHaveBeenCalled();
    });
  });

  describe("Event Authorization & Ownership Checks", () => {
    it("getEvents chỉ lấy sự kiện thuộc về calendar do session.userId sở hữu", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      mockDb.event.findMany.mockResolvedValue([]);

      await getEvents({ calendarIds: ["cal-1", "cal-2"], from: new Date(), to: new Date() });

      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            calendarId: { in: ["cal-1", "cal-2"] },
            calendar: { ownerId: "user-1" },
          }),
        })
      );
    });

    it("createEvent từ chối tạo event trên calendar của người khác", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      mockDb.calendar.findFirst.mockResolvedValue(null);

      await expect(
        createEvent({
          calendarId: "cal-victim",
          ownerId: "user-1",
          title: "Fake Event",
          startTime: new Date(),
          endTime: new Date(),
        })
      ).rejects.toThrow("Calendar not found");
      expect(mockDb.event.create).not.toHaveBeenCalled();
    });

    it("updateEvent từ chối sửa event không do session.userId sở hữu", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      mockDb.event.findFirst.mockResolvedValue(null);

      await expect(updateEvent("event-other", { title: "New Title" })).rejects.toThrow("Event not found");
      expect(mockDb.event.update).not.toHaveBeenCalled();
    });

    it("deleteEvent từ chối xóa event không do session.userId sở hữu", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-1",
        role: "TEACHER",
      } as any);
      mockDb.event.findFirst.mockResolvedValue(null);

      await expect(deleteEvent("event-other")).rejects.toThrow("Event not found");
      expect(mockDb.event.delete).not.toHaveBeenCalled();
    });
  });

  describe("getSchedulesForCalendar Scoping", () => {
    it("STUDENT chỉ thấy thời khóa biểu lớp mình tham gia, không tin role/classIds gửi từ client", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "student-user-1",
        role: "STUDENT",
      } as any);
      mockDb.scheduleSeries.findMany.mockResolvedValue([]);

      await getSchedulesForCalendar("fake-user", "ADMIN", "fake-teacher", ["fake-class"], new Date(), new Date());

      expect(mockDb.scheduleSeries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            class: { students: { some: { userId: "student-user-1" } } },
          },
        })
      );
    });
  });
});
