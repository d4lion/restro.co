import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, isStoreOpenNow } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge tailwind class names correctly", () => {
    const result = cn("px-2 py-1", "bg-red-500", { "text-white": true, "hidden": false });
    expect(result).toBe("px-2 py-1 bg-red-500 text-white");
  });

  it("should handle conflicting tailwind classes by keeping the last one", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });
});

describe("isStoreOpenNow utility function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true when business hours array is empty or undefined", () => {
    expect(isStoreOpenNow([])).toBe(true);
    expect(isStoreOpenNow(null as unknown as Parameters<typeof isStoreOpenNow>[0])).toBe(true);
  });

  it("should return true when current time is within open hours on a Monday", () => {
    // Set system time to Monday, 14:30 (Monday is dayOfWeek 1)
    // 2026-08-31 is a Monday
    const date = new Date("2026-08-31T14:30:00.000Z");
    vi.setSystemTime(date);

    const businessHours = [
      { dayOfWeek: 1, openTime: "08:00", closeTime: "22:00" }, // Monday
      { dayOfWeek: 2, openTime: "08:00", closeTime: "22:00" }, // Tuesday
    ];

    expect(isStoreOpenNow(businessHours, "UTC")).toBe(true);
  });

  it("should return false when current time is outside open hours on a Monday", () => {
    // Set system time to Monday, 07:00 (before 08:00)
    const date = new Date("2026-08-31T07:00:00.000Z");
    vi.setSystemTime(date);

    const businessHours = [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00" },
    ];

    expect(isStoreOpenNow(businessHours, "UTC")).toBe(false);
  });

  it("should return false when no hours exist for the current day", () => {
    // Monday 2026-08-31
    const date = new Date("2026-08-31T12:00:00.000Z");
    vi.setSystemTime(date);

    const businessHours = [
      { dayOfWeek: 0, openTime: "08:00", closeTime: "22:00" }, // Sunday only
    ];

    expect(isStoreOpenNow(businessHours, "UTC")).toBe(false);
  });
});
