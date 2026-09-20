import { z } from 'zod'

export const featuredSchema = z.object({
  isFeatured: z.boolean({ error: 'isFeatured must be true or false' }),
})
