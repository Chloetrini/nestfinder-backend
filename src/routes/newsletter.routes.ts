import { Router } from 'express'
import { deleteSubscriber, getSubscribers, subscribe } from '../controllers/newsletter.controller.js'
import { adminOnly, protect } from '../middlewares/auth.middleware.js'
import { enquiryLimiter } from '../middlewares/rate-limit.middleware.js'
import { validateBody } from '../middlewares/schema.middleware.js'
import { subscribeSchema } from '../validators/newsletter.schema.js'

const router = Router()

router.post('/', enquiryLimiter, validateBody(subscribeSchema), subscribe)

router.get('/', protect, adminOnly, getSubscribers)
router.delete('/:id', protect, adminOnly, deleteSubscriber)

export default router
