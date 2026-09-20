// Admin notification for a message sent from the Contact page.

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

export const contactEmailTemplate = (input: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}): { subject: string; html: string } => {
  const name = escapeHtml(input.name)
  const email = escapeHtml(input.email)
  const phone = input.phone ? escapeHtml(input.phone) : 'Not provided'
  const subject = escapeHtml(input.subject)
  const message = escapeHtml(input.message).replace(/\n/g, '<br>')

  return {
    subject: `Contact form: ${input.subject}`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:40px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#1A3C34;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">NestFinder Pro</h1>
        <p style="color:#B1FFED;margin:8px 0 0;font-size:13px;">New Contact Message</p>
      </div>
      <div style="padding:32px;">
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#444;"><strong>From:</strong> ${name}</p>
          <p style="margin:0 0 8px;color:#444;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0 0 8px;color:#444;"><strong>Phone:</strong> ${phone}</p>
          <p style="margin:0 0 8px;color:#444;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin:0;color:#444;"><strong>Message:</strong><br>${message}</p>
        </div>
        <a href="mailto:${email}" style="display:inline-block;background:#1A3C34;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply to ${name}</a>
      </div>
    </div>
  </body>
</html>`,
  }
}
