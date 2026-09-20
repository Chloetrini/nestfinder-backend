import type { Request, Response } from 'express'
import { env } from '../config/keys.js'
import logger from '../config/logger.js'
import Enquiry from '../models/enquiry.model.js'
import Property from '../models/property.model.js'
import { enquiryEmailTemplate } from '../services/email/enquiry-email.js'
import { sendEmail } from '../services/email/send-email.js'
import { AppError } from '../utils/app-error.js'
import tryCatchWrapper from '../utils/try-catch-wrapper.js'
import { sendSuccess } from '../utils/response-handler.js'

// POST /api/enquiries  (public)
export const submitEnquiry = tryCatchWrapper(async (req: Request, res: Response) => {
  const { name, email, message, propertyId } = req.body

  const property = await Property.findById(propertyId).select('propertyName').lean()
  if (!property) throw new AppError('Property not found', 404)

  const enquiry = await Enquiry.create({ name, email, message, propertyId, propertyName: property.propertyName })

  // Notify the admin in the background so the visitor isn't kept waiting on the mail API
  if (env.ADMIN_EMAIL) {
    const { subject, html } = enquiryEmailTemplate({ propertyName: property.propertyName, name, email, message })
    sendEmail({ to: env.ADMIN_EMAIL, subject, html }).catch(error => logger.error({ err: error }, 'Enquiry email failed'))
  }

  sendSuccess(res, 201, {
    message: 'Enquiry submitted successfully! The agent will contact you soon.',
    enquiry,
  })
})

// GET /api/enquiries  (admin)

export const getEnquiries = tryCatchWrapper(async (_req: Request, res: Response) => {
  const enquiries = await Enquiry.find().sort({ createdAt: -1 }).lean()
  sendSuccess(res, 200, { count: enquiries.length, enquiries })
})

// PUT /api/enquiries/:id  (admin)

export const updateEnquiryStatus = tryCatchWrapper(async (req: Request, res: Response) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after' }).lean()
  if (!enquiry) throw new AppError('Enquiry not found', 404)

  sendSuccess(res, 200, { enquiry })
})

// DELETE /api/enquiries/:id  (admin)

export const deleteEnquiry = tryCatchWrapper(async (req: Request, res: Response) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id)
  if (!enquiry) throw new AppError('Enquiry not found', 404)

  sendSuccess(res, 200, { message: 'Enquiry deleted' })
})
