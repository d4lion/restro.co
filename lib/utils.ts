import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isStoreOpenNow(
  businessHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  timezone: string = "America/Bogota"
): boolean {
  if (!businessHours || businessHours.length === 0) {
    return true; // Open by default if no hours are configured
  }

  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;
  
  const weekday = getPart("weekday");
  const hourPart = getPart("hour");
  const minutePart = getPart("minute");
  
  // handle hour 24 format edge cases in JS (sometimes "24", sometimes "00")
  let hour = parseInt(hourPart || "0", 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(minutePart || "0", 10);

  const daysMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  
  const currentDayOfWeek = daysMap[weekday as string];
  const currentTimeMinutes = hour * 60 + minute;

  const todaysHours = businessHours.filter((h) => h.dayOfWeek === currentDayOfWeek);

  if (todaysHours.length === 0) {
    return false; // Closed if there are configured hours but none for today
  }

  return todaysHours.some((block) => {
    const [openH, openM] = block.openTime.split(":").map(Number);
    const [closeH, closeM] = block.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes;
  });
}

