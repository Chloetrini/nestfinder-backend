import { z } from 'zod'

export const subscribeSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().pipe(z.email('Please enter a valid email')),
})
