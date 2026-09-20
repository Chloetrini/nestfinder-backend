import type { Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
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

  await Subscriber.create({ email, unsubscribeToken: randomBytes(24).toString('hex') })

  // Welcome email in the background so the visitor isn't kept waiting on the mail API
  const mail = welcomeEmailTemplate()
  sendEmail({ to: email, subject: mail.subject, html: mail.html }).catch(error => logger.error({ err: error }, 'Welcome email failed'))

  sendSuccess(res, 201, { message: 'Thank you for subscribing!' })
})

// GET /api/newsletter/unsubscribe/:token  (public, opened from the link in the emails)
export const unsubscribe = tryCatchWrapper(async (req: Request, res: Response) => {
  const removed = await Subscriber.findOneAndDelete({ unsubscribeToken: String(req.params.token) })

  const message = removed ? 'You have been unsubscribed and will not get more emails from NestFinder Pro.' : 'This unsubscribe link is no longer valid, you may already be unsubscribed.'
  res
    .status(removed ? 200 : 404)
    .type('html')
    .send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head><body style="font-family:Arial,sans-serif;background:#f3f4f6;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><div style="background:#fff;padding:40px;border-radius:12px;max-width:420px;text-align:center"><h1 style="color:#1A3C34;font-size:22px;margin:0 0 12px">NestFinder Pro</h1><p style="color:#444;line-height:1.6;margin:0">${message}</p></div></body></html>`)
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
