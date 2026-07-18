import { z } from 'zod';

export function sanitizeString(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export const emailSchema = z.string().email('Invalid email format').max(255);
export const phoneSchema = z.string().regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const addressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{6}$/, 'Invalid postal code'),
  country: z.string().default('IN'),
  phone: phoneSchema,
});
