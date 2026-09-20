import type { Request, Response } from 'express'
import { env } from '../config/keys.js'
import logger from '../config/logger.js'
import ContactMessage from '../models/contact.model.js'
import { contactEmailTemplate } from '../services/email/contact-email.js'
import { sendEmail } from '../services/email/send-email.js'
import tryCatchWrapper from '../utils/try-catch-wrapper.js'
import { sendSuccess } from '../utils/response-handler.js'

const THANK_YOU = 'Thank you! Your message has been sent and we will get back to you soon.'

// POST /api/contact  (public)
export const submitContact = tryCatchWrapper(async (req: Request, res: Response) => {
  const { name, email, phone, subject, message, website } = req.body

  // Honeypot: pretend it worked so bots don't learn anything
  if (website) return sendSuccess(res, 201, { message: THANK_YOU })

  await ContactMessage.create({ name, email, phone: phone || undefined, subject, message })

  // Notify the admin in the background so the visitor isn't kept waiting on the mail API
  if (env.ADMIN_EMAIL) {
    const mail = contactEmailTemplate({ name, email, phone, subject, message })
    sendEmail({ to: env.ADMIN_EMAIL, subject: mail.subject, html: mail.html }).catch(error =>
      logger.error({ err: error }, 'Contact email failed')
    )
  }

  sendSuccess(res, 201, { message: THANK_YOU })
})
