import { afterEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ setNow: vi.fn(), effect: vi.fn() }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: () => [null, hooks.setNow],
  useEffect: hooks.effect,
}));
vi.mock("@/actions/quizzes", () => ({}));
vi.mock("@/components/PDFRegionSelector", () => ({ default: () => null }));
vi.mock("@/components/MathRenderer", () => ({ default: () => null }));
vi.mock("@/components/Toast", () => ({ showToast: vi.fn() }));
import { getCandidateBindingState, useCandidateBindingClock } from "@/components/TeacherQuizManager";

const now = Date.parse("2026-11-14T12:00:00Z");
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("Candidate browser binding UI", () => {
  it("disables unlock for an unbound candidate", () => {
    expect(getCandidateBindingState(null, now)).toEqual({ label: "Chưa liên kết", canUnlock: false });
  });
  it("enables unlock only before the expiry, including timezone offsets", () => {
    expect(getCandidateBindingState("2026-11-14T19:00:01+07:00", now)).toEqual({ label: "Đang liên kết", canUnlock: true });
    expect(getCandidateBindingState("2026-11-14T19:00:00+07:00", now)).toEqual({ label: "Đã hết hạn", canUnlock: false });
    expect(getCandidateBindingState("2026-11-14T11:59:59Z", now).canUnlock).toBe(false);
  });
  it("keeps unlock disabled until the client clock is ready", () => {
    expect(getCandidateBindingState("2026-11-15T12:00:00Z", null).canUnlock).toBe(false);
  });
  it("refreshes exactly at expiry, on tab return, and cleans up on close", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const windowTarget = new EventTarget();
    const documentTarget = new EventTarget();
    vi.stubGlobal("window", windowTarget);
    vi.stubGlobal("document", documentTarget);
    const expiry = new Date(now + 1500).toISOString();
    useCandidateBindingClock(true, [expiry]);
    const cleanup = hooks.effect.mock.calls[0][0]();
    vi.advanceTimersByTime(0);
    expect(getCandidateBindingState(expiry, hooks.setNow.mock.lastCall![0]).canUnlock).toBe(true);
    vi.advanceTimersByTime(1499);
    expect(hooks.setNow).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(getCandidateBindingState(expiry, hooks.setNow.mock.lastCall![0])).toEqual({ label: "Đã hết hạn", canUnlock: false });
    vi.setSystemTime(now + 10_000);
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(hooks.setNow).toHaveBeenLastCalledWith(now + 10_000);
    windowTarget.dispatchEvent(new Event("focus"));
    cleanup();
    const count = hooks.setNow.mock.calls.length;
    vi.advanceTimersByTime(60_000);
    windowTarget.dispatchEvent(new Event("focus"));
    expect(hooks.setNow).toHaveBeenCalledTimes(count);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not schedule updates while the modal is closed", () => {
    useCandidateBindingClock(false, []);
    expect(hooks.effect.mock.calls[0][0]()).toBeUndefined();
  });
});
