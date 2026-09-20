import type { Request, Response } from 'express'
import logger from '../config/logger.js'
import Subscriber from '../models/subscriber.model.js'
import { sendEmail } from '../services/email/send-email.js'
import { welcomeEmailTemplate } from '../services/email/welcome-email.js'
import { AppError } from '../utils/app-error.js'
import tryCatchWrapper from '../utils/try-catch-wrapper.js'
import { sendSuccess } from '../utils/response-handler.js'

// POST /api/newsletter  (public)
export const subscribe = tryCatchWrapper(async (req: Request, res: Response) => {
  const { email } = req.body

  const existing = await Subscriber.exists({ email })
  if (existing) return sendSuccess(res, 200, { message: 'You are already subscribed. Thank you!' })

  await Subscriber.create({ email })

  // Welcome email in the background so the visitor isn't kept waiting on the mail API
  const mail = welcomeEmailTemplate()
  sendEmail({ to: email, subject: mail.subject, html: mail.html }).catch(error => logger.error({ err: error }, 'Welcome email failed'))

  sendSuccess(res, 201, { message: 'Thank you for subscribing!' })
})

// GET /api/newsletter  (admin)
export const getSubscribers = tryCatchWrapper(async (_req: Request, res: Response) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 }).lean()
  sendSuccess(res, 200, { count: subscribers.length, subscribers })
})

// DELETE /api/newsletter/:id  (admin)
export const deleteSubscriber = tryCatchWrapper(async (req: Request, res: Response) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id)
  if (!subscriber) throw new AppError('Subscriber not found', 404)

  sendSuccess(res, 200, { message: 'Subscriber removed' })
})
