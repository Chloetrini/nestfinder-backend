import { Router } from 'express'
import { deleteEnquiry, getEnquiries, submitEnquiry, updateEnquiryStatus } from '../controllers/enquiry.controller.js'
import { adminOnly, protect } from '../middlewares/auth.middleware.js'
import { enquiryLimiter } from '../middlewares/rate-limit.middleware.js'
import { validateBody } from '../middlewares/schema.middleware.js'
import { enquirySchema, enquiryStatusSchema } from '../validators/enquiry.schema.js'

const router = Router()

router.post('/', enquiryLimiter, validateBody(enquirySchema), submitEnquiry)

router.get('/', protect, adminOnly, getEnquiries)
router.put('/:id', protect, adminOnly, validateBody(enquiryStatusSchema), updateEnquiryStatus)
router.delete('/:id', protect, adminOnly, deleteEnquiry)

export default router
