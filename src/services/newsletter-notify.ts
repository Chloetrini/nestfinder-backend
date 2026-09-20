import { randomBytes } from 'node:crypto'
import { env } from '../config/keys.js'
import logger from '../config/logger.js'
import Subscriber from '../models/subscriber.model.js'
import type { IProperty } from '../models/property.model.js'
import { newListingEmailTemplate } from './email/new-listing-email.js'
import { sendEmail } from './email/send-email.js'

const CONCURRENCY = 5

// Emails every newsletter subscriber about a newly published property.
// Runs in the background (callers do not await it) and never throws: a mail problem must not break publishing.
export const notifySubscribersOfProperty = async (property: Pick<IProperty, '_id' | 'propertyName' | 'price' | 'sale' | 'propertyType' | 'location' | 'propertyDetails' | 'images'>, apiBaseUrl: string): Promise<void> => {
  try {
    const subscribers = await Subscriber.find().lean()
    if (subscribers.length === 0) return

    const clientUrl = (env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
    const propertyUrl = `${clientUrl}/property/${property._id}`
    let sent = 0
    let failed = 0

    const sendOne = async (subscriber: (typeof subscribers)[number]) => {
      // Subscribers who joined before unsubscribe links existed get their token now
      let token = subscriber.unsubscribeToken
      if (!token) {
        token = randomBytes(24).toString('hex')
        await Subscriber.updateOne({ _id: subscriber._id }, { unsubscribeToken: token })
      }

      const mail = newListingEmailTemplate({
        name: property.propertyName,
        price: property.price,
        sale: property.sale,
        propertyType: property.propertyType,
        location: [property.location?.city, property.location?.state].filter(Boolean).join(', ') || property.location?.fullAddress || '',
        bedrooms: property.propertyDetails?.bedrooms ?? 0,
        bathroom: property.propertyDetails?.bathroom ?? 0,
        image: property.images?.[0],
        propertyUrl,
        unsubscribeUrl: `${apiBaseUrl}/api/newsletter/unsubscribe/${token}`,
      })

      try {
        await sendEmail({ to: subscriber.email, subject: mail.subject, html: mail.html })
        sent++
      } catch (error) {
        failed++
        logger.error({ err: error, to: subscriber.email }, 'New-listing email failed')
      }
    }

    // A few at a time, so a big list does not hit the mail API all at once
    for (let i = 0; i < subscribers.length; i += CONCURRENCY) {
      await Promise.all(subscribers.slice(i, i + CONCURRENCY).map(sendOne))
    }

    logger.info({ property: property.propertyName, sent, failed }, 'Subscribers notified about new property')
  } catch (error) {
    logger.error({ err: error }, 'Could not notify subscribers')
  }
}
