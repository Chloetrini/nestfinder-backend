// Admin notification for a new property enquiry.

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

export const enquiryEmailTemplate = (input: {
  propertyName: string
  name: string
  email: string
  message: string
}): { subject: string; html: string } => {
  const propertyName = escapeHtml(input.propertyName)
  const name = escapeHtml(input.name)
  const email = escapeHtml(input.email)
  const message = escapeHtml(input.message)

  return {
    subject: `New Enquiry for ${input.propertyName}`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:40px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#1A3C34;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">NestFinder Pro</h1>
        <p style="color:#B1FFED;margin:8px 0 0;font-size:13px;">New Property Enquiry</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#023337;margin:0 0 16px;">New Enquiry Received</h2>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#444;"><strong>Property:</strong> ${propertyName}</p>
          <p style="margin:0 0 8px;color:#444;"><strong>From:</strong> ${name}</p>
          <p style="margin:0 0 8px;color:#444;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;color:#444;"><strong>Message:</strong> ${message}</p>
        </div>
        <a href="mailto:${email}" style="display:inline-block;background:#1A3C34;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply to ${name}</a>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#75928B;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} NestFinder Pro</p>
      </div>
    </div>
  </body>
</html>`,
  }
}
