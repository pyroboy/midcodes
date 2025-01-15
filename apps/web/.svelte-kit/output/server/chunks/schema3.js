import { z } from "zod";
const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address").max(100, "Email is too long"),
  phone: z.string().min(1, "Phone number is required").regex(/((^(\+)(\d){12}$)|(^\d{11}$))/, "Phone number must be in Philippine format: +639191234567 or 09191234567").max(20, "Phone number is too long"),
  ticketType: z.string().min(1, "Ticket type is required"),
  recaptchaToken: z.string().optional(),
  additionalInfo: z.record(z.string()).optional()
});
export {
  registrationSchema as r
};
