import { z } from 'zod'

const required = (label: string) => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`)

export const enquirySchema = z.object({
  name: required('Name').max(100),
  email: z.string({ error: 'Email is required' }).trim().pipe(z.email('Please enter a valid email')),
  message: required('Message').max(2000, 'Message is too long'),
  propertyId: required('Property'),
})

export const enquiryStatusSchema = z.object({
  status: z.enum(['new', 'responded'], { error: 'Status must be "new" or "responded"' }),
})
