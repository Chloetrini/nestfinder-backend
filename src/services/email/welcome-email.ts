// Thank-you email sent to a new newsletter subscriber.

export const welcomeEmailTemplate = (): { subject: string; html: string } => ({
  subject: 'Welcome to NestFinder Pro',
  html: `
<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:40px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#1A3C34;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">NestFinder Pro</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#023337;margin:0 0 12px;">You are subscribed</h2>
        <p style="color:#444;line-height:1.6;margin:0;">Thank you for joining the NestFinder Pro newsletter. We will send you new listings and property tips. You can reply to this email at any time to unsubscribe.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#75928B;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} NestFinder Pro</p>
      </div>
    </div>
  </body>
</html>`,
})
