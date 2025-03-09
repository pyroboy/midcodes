import { z } from 'zod';

// Room schema
export const RoomSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  beds: z.string(),
  capacity: z.string(),
  features: z.array(z.string()),
  size: z.string(),
  image: z.string(),
  price: z.number().positive()
});

// Base booking form schema without refinements
const baseBookingFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  checkIn: z.string()
    .refine(val => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: 'Check-in date cannot be in the past' }),
  checkOut: z.string(),
  adults: z.number().min(1, { message: 'At least 1 adult is required' }),
  children: z.number().min(0),
  roomId: z.number(),
  specialRequests: z.string().optional()
});

// Booking form schema with validation
export const BookingFormSchema = baseBookingFormSchema.refine(data => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut']
});

// Booking schema (extends base form schema with additional fields)
export const BookingSchema = z.object({
  ...baseBookingFormSchema.shape,
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  totalPrice: z.number().positive()
}).refine(data => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut']
});

// Types derived from schemas
export type Room = z.infer<typeof RoomSchema>;
export type BookingForm = z.infer<typeof BookingFormSchema>;
export type Booking = z.infer<typeof BookingSchema>;
