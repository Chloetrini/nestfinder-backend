import { z } from 'zod'

const required = (label: string) => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`)

export const contactSchema = z.object({
  name: required('Name').max(100),
  email: z.string({ error: 'Email is required' }).trim().pipe(z.email('Please enter a valid email')),
  phone: z.string().trim().max(30, 'Phone number is too long').optional(),
  subject: required('Subject').max(120),
  message: required('Message').min(10, 'Please write a little more (at least 10 characters)').max(2000, 'Message is too long'),
  // Hidden field real visitors never fill in; bots do. Filled = silently ignored.
  website: z.string().optional(),
})
