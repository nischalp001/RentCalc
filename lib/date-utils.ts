import { format } from "date-fns";

// Utility function to convert AD date to BS date string
export function adToBs(adDate: Date | string): string {
  // This is a simplified conversion - in a real app, you'd use a proper calendar library
  // For now, we'll return a placeholder BS date format
  const date = typeof adDate === 'string' ? new Date(adDate) : adDate;
  const year = date.getFullYear() + 57; // Approximate conversion (AD + 57 = BS)
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Utility function to format date for display with both AD and BS
export function formatDateWithBothCalendars(date: Date | string | null): {
  ad: string;
  bs: string;
  full: string;
} {
  if (!date) return { ad: 'N/A', bs: 'N/A', full: 'N/A' };

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const ad = format(dateObj, 'MMM d, yyyy');
  const bs = adToBs(dateObj);
  const full = `${ad} (${bs})`;

  return { ad, bs, full };
}

// Utility function to get calendar preference from localStorage
export function getCalendarPreference(): 'ad' | 'bs' | 'both' {
  if (typeof window === 'undefined') return 'both';
  return (localStorage.getItem('calendarPreference') as 'ad' | 'bs' | 'both') || 'both';
}

// Utility function to set calendar preference
export function setCalendarPreference(preference: 'ad' | 'bs' | 'both'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('calendarPreference', preference);
  }
}