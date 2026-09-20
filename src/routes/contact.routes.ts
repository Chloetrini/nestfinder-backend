import { Router } from 'express'
import { submitContact } from '../controllers/contact.controller.js'
import { enquiryLimiter } from '../middlewares/rate-limit.middleware.js'
import { validateBody } from '../middlewares/schema.middleware.js'
import { contactSchema } from '../validators/contact.schema.js'

const router = Router()

router.post('/', enquiryLimiter, validateBody(contactSchema), submitContact)

export default router
