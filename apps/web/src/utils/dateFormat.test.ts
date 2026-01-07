import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  isToday,
  isOverdue,
  formatDueDate,
  dateToInputValue,
  inputValueToISO,
} from './dateFormat.js';

describe('dateFormat', () => {
  beforeEach(() => {
    // Use fake timers to mock Date consistently
    // Set mock date to 2026-01-15 12:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should_return_just_now_for_very_recent_dates', () => {
      const date = new Date('2026-01-15T12:00:00.000Z');
      expect(formatDate(date)).toBe('just now');
    });

    it('should_return_minutes_ago_for_recent_dates', () => {
      const date = new Date('2026-01-15T11:45:00.000Z');
      expect(formatDate(date)).toBe('15 minutes ago');
    });

    it('should_return_singular_minute_ago', () => {
      const date = new Date('2026-01-15T11:59:00.000Z');
      expect(formatDate(date)).toBe('1 minute ago');
    });

    it('should_return_hours_ago_for_recent_dates', () => {
      const date = new Date('2026-01-15T10:00:00.000Z');
      expect(formatDate(date)).toBe('2 hours ago');
    });

    it('should_return_singular_hour_ago', () => {
      const date = new Date('2026-01-15T11:00:00.000Z');
      expect(formatDate(date)).toBe('1 hour ago');
    });

    it('should_return_days_ago_for_recent_dates', () => {
      const date = new Date('2026-01-14T12:00:00.000Z');
      expect(formatDate(date)).toBe('1 day ago');
    });

    it('should_return_plural_days_ago', () => {
      const date = new Date('2026-01-13T12:00:00.000Z');
      expect(formatDate(date)).toBe('2 days ago');
    });

    it('should_return_absolute_date_for_older_dates', () => {
      const date = new Date('2026-01-01T12:00:00.000Z');
      const result = formatDate(date);
      expect(result).toMatch(/Jan 1, 2026/);
    });

    it('should_handle_string_dates', () => {
      const dateString = '2026-01-15T11:00:00.000Z';
      expect(formatDate(dateString)).toBe('1 hour ago');
    });

    it('should_handle_dates_exactly_7_days_ago', () => {
      const date = new Date('2026-01-08T12:00:00.000Z');
      const result = formatDate(date);
      // Should use absolute format for dates >= 7 days
      expect(result).toMatch(/Jan 8, 2026/);
    });
  });

  describe('isToday', () => {
    it('should_return_true_for_today', () => {
      // Use the mocked system time (2026-01-15 12:00:00 UTC)
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should_return_false_for_yesterday', () => {
      const yesterday = new Date('2026-01-14T12:00:00.000Z');
      expect(isToday(yesterday)).toBe(false);
    });

    it('should_return_false_for_tomorrow', () => {
      const tomorrow = new Date('2026-01-16T12:00:00.000Z');
      expect(isToday(tomorrow)).toBe(false);
    });

    it('should_handle_string_dates', () => {
      // Use the mocked system time as a string
      const todayString = new Date().toISOString();
      expect(isToday(todayString)).toBe(true);
    });

    it('should_ignore_time_component', () => {
      // Create dates for today at different times
      const today = new Date();
      const earlyToday = new Date(today);
      earlyToday.setHours(0, 0, 0, 0);
      const lateToday = new Date(today);
      lateToday.setHours(23, 59, 59, 999);
      expect(isToday(earlyToday)).toBe(true);
      expect(isToday(lateToday)).toBe(true);
    });
  });

  describe('isOverdue', () => {
    it('should_return_true_for_past_dates', () => {
      const pastDate = new Date('2026-01-14T12:00:00.000Z');
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should_return_false_for_today', () => {
      // Use the mocked system time (today)
      const today = new Date();
      expect(isOverdue(today)).toBe(false);
    });

    it('should_return_false_for_future_dates', () => {
      const futureDate = new Date('2026-01-16T12:00:00.000Z');
      expect(isOverdue(futureDate)).toBe(false);
    });

    it('should_handle_string_dates', () => {
      const pastDateString = '2026-01-14T12:00:00.000Z';
      expect(isOverdue(pastDateString)).toBe(true);
    });

    it('should_ignore_time_component', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);
      const todayEarly = new Date(today);
      todayEarly.setHours(0, 0, 0, 0);
      expect(isOverdue(yesterday)).toBe(true);
      expect(isOverdue(todayEarly)).toBe(false);
    });
  });

  describe('formatDueDate', () => {
    it('should_return_empty_string_for_null', () => {
      expect(formatDueDate(null)).toBe('');
    });

    it('should_return_due_today_for_today', () => {
      const today = new Date('2026-01-15T12:00:00.000Z');
      expect(formatDueDate(today)).toBe('Due today');
    });

    it('should_return_due_tomorrow_for_tomorrow', () => {
      const tomorrow = new Date('2026-01-16T12:00:00.000Z');
      expect(formatDueDate(tomorrow)).toBe('Due tomorrow');
    });

    it('should_return_due_in_X_days_for_near_future', () => {
      const in3Days = new Date('2026-01-18T12:00:00.000Z');
      expect(formatDueDate(in3Days)).toBe('Due in 3 days');
    });

    it('should_return_due_in_7_days_for_week_away', () => {
      const in7Days = new Date('2026-01-22T12:00:00.000Z');
      expect(formatDueDate(in7Days)).toBe('Due in 7 days');
    });

    it('should_return_overdue_by_X_days_for_past_dates', () => {
      const yesterday = new Date('2026-01-14T12:00:00.000Z');
      expect(formatDueDate(yesterday)).toBe('Overdue by 1 day');
    });

    it('should_return_overdue_by_plural_days', () => {
      const threeDaysAgo = new Date('2026-01-12T12:00:00.000Z');
      expect(formatDueDate(threeDaysAgo)).toBe('Overdue by 3 days');
    });

    it('should_return_absolute_date_for_far_future', () => {
      const farFuture = new Date('2026-02-15T12:00:00.000Z');
      const result = formatDueDate(farFuture);
      expect(result).toMatch(/Feb 15/);
    });

    it('should_include_year_for_different_year', () => {
      const nextYear = new Date('2027-01-15T12:00:00.000Z');
      const result = formatDueDate(nextYear);
      expect(result).toMatch(/2027/);
    });

    it('should_handle_string_dates', () => {
      const todayString = '2026-01-15T12:00:00.000Z';
      expect(formatDueDate(todayString)).toBe('Due today');
    });

    it('should_ignore_time_component', () => {
      // Use local date to avoid timezone issues
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon local time
      const todayEarly = new Date(today);
      todayEarly.setHours(0, 0, 0, 0);
      const todayLate = new Date(today);
      todayLate.setHours(23, 59, 59, 999);
      expect(formatDueDate(todayEarly.toISOString())).toBe('Due today');
      expect(formatDueDate(todayLate.toISOString())).toBe('Due today');
    });
  });

  describe('dateToInputValue', () => {
    it('should_return_empty_string_for_null', () => {
      expect(dateToInputValue(null)).toBe('');
    });

    it('should_convert_date_to_YYYY_MM_DD_format', () => {
      const date = new Date('2026-01-15T12:00:00.000Z');
      const result = dateToInputValue(date);
      expect(result).toBe('2026-01-15');
    });

    it('should_handle_single_digit_months_and_days', () => {
      const date = new Date('2026-01-05T12:00:00.000Z');
      const result = dateToInputValue(date);
      expect(result).toBe('2026-01-05');
    });

    it('should_handle_string_dates', () => {
      const dateString = '2026-12-31T12:00:00.000Z';
      const result = dateToInputValue(dateString);
      expect(result).toBe('2026-12-31');
    });

    it('should_use_local_timezone', () => {
      // Create a date that might be different in UTC vs local
      const date = new Date(2026, 0, 15); // January 15, 2026 in local time
      const result = dateToInputValue(date);
      expect(result).toBe('2026-01-15');
    });
  });

  describe('inputValueToISO', () => {
    it('should_return_null_for_null', () => {
      expect(inputValueToISO(null)).toBeNull();
    });

    it('should_convert_YYYY_MM_DD_to_ISO_string', () => {
      const result = inputValueToISO('2026-01-15');
      expect(result).toBeTruthy();
      // The result will be in UTC, so check that it represents the correct date
      const date = new Date(result!);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('should_create_date_at_midnight_local_time', () => {
      const result = inputValueToISO('2026-01-15');
      const date = new Date(result!);
      // The date should represent January 15, 2026
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('should_handle_single_digit_months_and_days', () => {
      const result = inputValueToISO('2026-01-05');
      expect(result).toBeTruthy();
      const date = new Date(result!);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(5);
    });

    it('should_handle_end_of_month', () => {
      const result = inputValueToISO('2026-01-31');
      expect(result).toBeTruthy();
      const date = new Date(result!);
      expect(date.getDate()).toBe(31);
    });

    it('should_handle_leap_year', () => {
      const result = inputValueToISO('2024-02-29');
      expect(result).toBeTruthy();
      const date = new Date(result!);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(29);
    });
  });
});

