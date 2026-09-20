// Email sent to newsletter subscribers when a new property is published.

interface ListingEmailInput {
  name: string
  price: number
  sale: string
  propertyType: string
  location: string
  bedrooms: number
  bathroom: number
  image?: string
  propertyUrl: string
  unsubscribeUrl: string
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Cloudinary photos are resized so the email stays light
const smallImage = (url?: string) => (url ? url.replace('/upload/', '/upload/f_jpg,q_auto,c_fill,w_600,h_360/') : '')

export const newListingEmailTemplate = (p: ListingEmailInput): { subject: string; html: string } => ({
  subject: `New on NestFinder Pro: ${p.name}`,
  html: `
<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:32px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#1A3C34;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">NestFinder Pro</h1>
      </div>
      ${p.image ? `<a href="${p.propertyUrl}"><img src="${smallImage(p.image)}" alt="${escape(p.name)}" width="560" style="display:block;width:100%;height:auto;" /></a>` : ''}
      <div style="padding:28px;">
        <p style="margin:0 0 6px;color:#F4A261;font-weight:bold;font-size:13px;text-transform:uppercase;letter-spacing:1px;">New listing &middot; ${escape(p.sale)}</p>
        <h2 style="color:#023337;margin:0 0 8px;">${escape(p.name)}</h2>
        <p style="color:#555;margin:0 0 4px;">${escape(p.location)}</p>
        <p style="color:#555;margin:0 0 16px;">${escape(p.propertyType)} &middot; ${p.bedrooms} beds &middot; ${p.bathroom} baths</p>
        <p style="color:#1A3C34;font-size:26px;font-weight:bold;margin:0 0 24px;">&#8358;${p.price.toLocaleString('en-NG')}</p>
        <a href="${p.propertyUrl}" style="display:inline-block;background:#1A3C34;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;">View property</a>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#75928B;font-size:12px;margin:0;">You are receiving this because you subscribed to NestFinder Pro updates.<br /><a href="${p.unsubscribeUrl}" style="color:#75928B;">Unsubscribe</a></p>
      </div>
    </div>
  </body>
</html>`,
})
