import { ADToBS, BSToAD } from "bikram-sambat-js";

const bsDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value: number) => String(value).padStart(2, "0");

function toDate(input: Date | string) {
  if (input instanceof Date) {
    return input;
  }

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export function adToBs(adDate: Date | string | null | undefined): string {
  if (!adDate) {
    return "";
  }

  try {
    const dateObj = toDate(adDate);
    if (dateObj) {
      return ADToBS(dateObj);
    }

    if (typeof adDate === "string" && bsDatePattern.test(adDate)) {
      return ADToBS(adDate);
    }
  } catch {
    return "";
  }

  return "";
}

export function bsToAd(bsDate: string | null | undefined): string {
  const value = bsDate?.trim() || "";
  if (!value) {
    return "";
  }

  if (!bsDatePattern.test(value)) {
    throw new Error("Invalid Nepali date format. Use YYYY-MM-DD.");
  }

  const converted = BSToAD(value);
  return converted.slice(0, 10);
}

export function getTodayBsDate() {
  return adToBs(new Date());
}

export function formatNepaliDateFromAd(adDate: Date | string | null | undefined) {
  const bs = adToBs(adDate || "");
  return bs || "N/A";
}

export function formatNepaliDateTimeFromAd(adDate: Date | string | null | undefined) {
  if (!adDate) {
    return "N/A";
  }

  const dateObj = toDate(adDate);
  const bs = adToBs(adDate);
  if (!dateObj || !bs) {
    return "N/A";
  }

  const time = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${bs} ${time}`;
}

export function buildMonthlyBillingDateFromJoinDate(joinDateBs?: string | null, referenceBsDate?: string | null) {
  const reference = (referenceBsDate?.trim() || getTodayBsDate()).trim();
  if (!reference || !bsDatePattern.test(reference)) {
    return "";
  }

  const [yearText, monthText, dayText] = reference.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const fallbackDay = Number(dayText);

  const joinDayCandidate = (joinDateBs?.trim() && bsDatePattern.test(joinDateBs.trim()))
    ? Number(joinDateBs.trim().split("-")[2])
    : fallbackDay;

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return "";
  }

  let day = Number.isFinite(joinDayCandidate) ? joinDayCandidate : fallbackDay;
  day = Math.min(Math.max(day, 1), 32);

  for (let testDay = day; testDay >= 1; testDay -= 1) {
    const candidate = `${year}-${pad2(month)}-${pad2(testDay)}`;
    try {
      BSToAD(candidate);
      return candidate;
    } catch {
      // Continue until a valid date for this month is found.
    }
  }

  return reference;
}
