import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  // Zod v4: use { message: '...' } instead of { errorMap: () => ({ message: '...' }) }
  acceptTerms: z.literal(true, { message: 'You must accept the Terms of Service' }),
  acceptDataProcessing: z.literal(true, { message: 'You must consent to data processing' }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})
