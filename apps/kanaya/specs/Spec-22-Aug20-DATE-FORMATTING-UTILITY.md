# Spec-22-Aug20-DATE-FORMATTING-UTILITY

## Technical Specification: Centralized Date Formatting Utility

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (2/10)  
**Scope:** Code Organization & DRY Principle

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Eliminate duplicate formatDate functions** found in multiple components
- **Create centralized date utility** with consistent formatting patterns
- **Support multiple date formats** (full, short, relative, time-only)
- **Handle timezone considerations** for consistent display
- **Maintain existing functionality** while consolidating code
- **Keep bite-sized scope** - focus only on date formatting consolidation

---

## Step 2 – Context Awareness

### Current Duplication Analysis

```typescript
// Found in multiple files with slight variations:
// +page.svelte (homepage)
// account/+page.svelte
// admin/+page.svelte
// Multiple other components

function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
```

---

## Step 3 – Spec Expansion

### Centralized Date Utility Architecture

```typescript
// src/lib/utils/dateFormat.ts
export const DateFormats = {
	FULL: 'full', // "March 15, 2024 at 2:30 PM"
	SHORT: 'short', // "Mar 15, 2024"
	DATE_ONLY: 'date', // "March 15, 2024"
	TIME_ONLY: 'time', // "2:30 PM"
	RELATIVE: 'relative' // "2 hours ago"
} as const;
```

### Implementation Strategy

1. **Create date utility** with multiple format options
2. **Replace duplicate functions** across all components
3. **Add import statements** where formatDate is used
4. **Maintain backward compatibility** with existing date displays

---

## Step 4 – Implementation Guidance

### Date Utility Implementation

```typescript
// src/lib/utils/dateFormat.ts
type DateFormatType = 'full' | 'short' | 'date' | 'time' | 'relative';

export class DateFormatter {
	private static locale = 'en-US';

	static format(dateInput: string | Date, format: DateFormatType = 'full'): string {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}

		switch (format) {
			case 'full':
				return date.toLocaleDateString(this.locale, {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});

			case 'short':
				return date.toLocaleDateString(this.locale, {
					month: 'short',
					day: 'numeric'
				});

			case 'date':
				return date.toLocaleDateString(this.locale, {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});

			case 'time':
				return date.toLocaleTimeString(this.locale, {
					hour: '2-digit',
					minute: '2-digit'
				});

			case 'relative':
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

		return this.format(date, 'short');
	}
}

// Convenience functions for common use cases
export const formatDate = (date: string | Date, format?: DateFormatType) =>
	DateFormatter.format(date, format);

export const formatDateShort = (date: string | Date) => DateFormatter.format(date, 'short');

export const formatDateTime = (date: string | Date) => DateFormatter.format(date, 'full');

export const formatRelativeTime = (date: string | Date) => DateFormatter.format(date, 'relative');
```

### Component Updates

```typescript
// Replace existing formatDate functions with:
import { formatDate, formatDateShort } from '$lib/utils/dateFormat';

// Usage examples:
formatDate(template.created_at); // "Mar 15, 2024 at 2:30 PM"
formatDateShort(template.created_at); // "Mar 15"
formatDateTime(user.lastLogin); // Full format
formatRelativeTime(notification.timestamp); // "2 hours ago"
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 1/10)** – No visual changes, same date displays
2. **UX Changes (Complexity: 1/10)** – Consistent date formatting improves user experience
3. **Data Handling (Complexity: 1/10)** – Same date data, just formatted consistently
4. **Function Logic (Complexity: 2/10)** – Simple utility creation and function replacements
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems

**Estimated Development Time:** 1 hour  
**Success Criteria:** Single date utility used across all components, no duplicate formatDate functions
