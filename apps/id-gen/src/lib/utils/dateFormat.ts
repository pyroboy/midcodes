// Centralized Date Formatting Utility
// Provides multiple format options and convenience functions

export const DateFormats = {
  FULL: 'full',
  SHORT: 'short',
  DATE_ONLY: 'date',
  TIME_ONLY: 'time',
  RELATIVE: 'relative'
} as const;

export type DateFormatType = typeof DateFormats[keyof typeof DateFormats];

export class DateFormatter {
  private static locale = 'en-US';

  static format(dateInput: string | Date, format: DateFormatType = DateFormats.FULL): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    switch (format) {
      case DateFormats.FULL:
        return date.toLocaleDateString(this.locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

      case DateFormats.SHORT:
        return date.toLocaleDateString(this.locale, {
          month: 'short',
          day: 'numeric'
        });

      case DateFormats.DATE_ONLY:
        return date.toLocaleDateString(this.locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case DateFormats.TIME_ONLY:
        return date.toLocaleTimeString(this.locale, {
          hour: '2-digit',
          minute: '2-digit'
        });

      case DateFormats.RELATIVE:
        return this.getRelativeTime(date);

      default:
        return date.toLocaleDateString(this.locale);
    }
  }

  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;

    return this.format(date, DateFormats.SHORT);
  }
}

// Convenience functions for common use cases
export const formatDate = (date: string | Date, format: DateFormatType = DateFormats.FULL) =>
  DateFormatter.format(date, format);

export const formatDateShort = (date: string | Date) =>
  DateFormatter.format(date, DateFormats.SHORT);

export const formatDateTime = (date: string | Date) =>
  DateFormatter.format(date, DateFormats.FULL);

export const formatRelativeTime = (date: string | Date) =>
  DateFormatter.format(date, DateFormats.RELATIVE);
