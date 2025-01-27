import { z } from 'zod';

export const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const;
const EVENT_CATEGORIES = [
    'Athletics',
    'Academics & Literary',
    'Music',
    'Dances',
    'E-Sports',
    'MMUB',
    'Special'
] as const;

export type EventStatus = typeof EVENT_STATUSES[number];
export type EventCategory = typeof EVENT_CATEGORIES[number];

export const EventStatusEnum = z.enum(EVENT_STATUSES);
export const EventCategoryEnum = z.enum(EVENT_CATEGORIES);

export const eventSchema = z.object({
    id: z.string().optional(),
    event_name: z.string()
        .min(1, "Event name is required")
        .max(100, "Event name cannot exceed 100 characters"),
    medal_count: z.number()
        .int("Medal count must be a whole number")
        .min(0, "Medal count cannot be negative")
        .nullable(),
    category: EventCategoryEnum,
    event_status: EventStatusEnum.default('nodata')
}).superRefine((data, ctx) => {
    if (data.event_status !== 'nodata' && data.medal_count === null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Medal count is required for non-nodata status",
            path: ["medal_count"]
        });
    }
});

export type EventSchemaType = z.infer<typeof eventSchema>;