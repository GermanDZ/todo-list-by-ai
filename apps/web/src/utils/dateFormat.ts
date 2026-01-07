/**
 * Format a date as human-readable text
 * Recent dates (< 7 days): relative time (e.g., "2 hours ago")
 * Older dates: absolute format (e.g., "Jan 7, 2026")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // If less than 7 days, use relative time
  if (diffDays < 7) {
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDaysRounded = Math.floor(diffDays);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDaysRounded} ${diffDaysRounded === 1 ? 'day' : 'days'} ago`;
    }
  }

  // For older dates, use absolute format
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if a date is today (ignoring time)
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is overdue (before today, ignoring time)
 */
export function isOverdue(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateObj);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Format a due date relative to today
 * Returns: "Due today", "Due in 2 days", "Overdue by 3 days", or absolute date
 */
export function formatDueDate(dueDate: Date | string | null): string {
  if (!dueDate) {
    return '';
  }

  const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateObj);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return `Overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}`;
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    // For dates more than a week away, show absolute date
    return `Due ${dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })}`;
  }
}

/**
 * Convert a Date object or ISO string to YYYY-MM-DD string for date input
 * Uses local timezone to ensure the date displayed matches user's local date
 */
export function dateToInputValue(date: Date | string | null): string {
  if (!date) {
    return '';
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Use local date components to avoid timezone issues
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD string to ISO 8601 datetime string
 * Creates date at midnight in local timezone, then converts to ISO
 */
export function inputValueToISO(dateString: string | null): string | null {
  if (!dateString) {
    return null;
  }
  // Parse as local date (YYYY-MM-DD format)
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at midnight local time
  const date = new Date(year, month - 1, day);
  // Return ISO string (will be in UTC)
  return date.toISOString();
}

