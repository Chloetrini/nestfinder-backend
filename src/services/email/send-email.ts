import { env } from '../../config/keys.js'
import logger from '../../config/logger.js'

// Sends mail through the Brevo REST API (plain HTTP, no SDK needed).
// Throws when Brevo rejects the request so callers can decide what to do.

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailInput): Promise<void> => {
  if (!env.BREVO_API_KEY || !env.EMAIL_FROM) {
    throw new Error('Email is not configured (set BREVO_API_KEY and EMAIL_FROM)')
  }

  const senderEmail = env.EMAIL_FROM.match(/<(.+)>/)?.[1] || env.EMAIL_FROM

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'NestFinder Pro', email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Brevo API error ${response.status}: ${detail}`)
  }

  logger.info({ to }, 'Email sent')
}
