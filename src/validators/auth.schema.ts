import { z } from 'zod'

const email = z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Please enter a valid email'))

export const registerSchema = z.object({
  name: z.string({ error: 'All fields are required' }).trim().min(1, 'All fields are required'),
  email,
  password: z
    .string({ error: 'All fields are required' })
    .min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Email and password are required' }).min(1, 'Email and password are required'),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password: z.string({ error: 'Both password field are required' }).min(1, 'Both password field are required'),
    confirmPassword: z.string({ error: 'Both password field are required' }).min(1, 'Both password field are required'),
  })
  .refine(data => data.password === data.confirmPassword, { message: 'Password do not match', path: ['confirmPassword'] })
  .refine(data => data.password.length >= 8, { message: 'Password must be at least 8 characters', path: ['password'] })
