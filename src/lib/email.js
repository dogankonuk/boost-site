import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL

export async function sendVerificationEmail({ to, username, link }) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Verify your email — ShadowBoosting',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
              <h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#fff;">Verify your email</h1>
              <p style="color:#777;margin:0 0 24px;font-size:14px;">Hi ${username}, please verify your email address to activate your account.</p>
              <a href="${link}" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Verify My Email →</a>
              <p style="color:#555;font-size:12px;margin:20px 0 0;">This link is valid for 24 hours. If you didn't request this, you can safely ignore this email.</p>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

export async function sendPasswordResetEmail({ to, username, link }) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Password reset request — ShadowBoosting',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
              <h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#fff;">Reset your password</h1>
              <p style="color:#777;margin:0 0 24px;font-size:14px;">Hi ${username}, we received a request to reset your password.</p>
              <a href="${link}" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Reset My Password →</a>
              <p style="color:#555;font-size:12px;margin:20px 0 0;">This link is valid for 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

// Fires right after a password change succeeds — the account's only signal
// that it happened, since a stolen session token isn't invalidated by this
// change. Not a confirm-before-change gate (that's what current-password
// re-entry, already required server-side, is for).
export async function sendPasswordChangedEmail({ to, username }) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your password was changed — ShadowBoosting',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
              <h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#fff;">Your password was changed</h1>
              <p style="color:#777;margin:0 0 8px;font-size:14px;">Hi ${username}, this confirms your account password was just changed.</p>
              <p style="color:#555;font-size:12px;margin:20px 0 0;">If this was you, no action is needed. If you didn't make this change, <a href="mailto:support@shadowboosting.co" style="color:#f5c518;">contact support</a> right away.</p>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

export async function sendBlogUnpublishedEmail({ to, username, postTitle }) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your post was unpublished — ShadowBoosting',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
              <h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#fff;">Your post was unpublished</h1>
              <p style="color:#777;margin:0 0 8px;font-size:14px;">Hi ${username}, an admin unpublished your post:</p>
              <p style="color:#fff;margin:0 0 24px;font-size:16px;font-weight:600;">"${postTitle}"</p>
              <p style="color:#555;font-size:12px;margin:0;">You can review and republish it from your Content Studio whenever you're ready.</p>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

export async function sendOrderConfirmation({ to, username, orderNumber, gameName, serviceName, price, details }) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Order Received — ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;">
              <h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#fff;">Order Received! 🎮</h1>
              <p style="color:#777;margin:0 0 24px;font-size:14px;">Hi ${username}, your order was placed successfully.</p>

              <div style="background:#0a0a0a;border-radius:10px;padding:16px;margin-bottom:16px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Order #</td>
                    <td style="padding:6px 0;color:#f5c518;font-size:13px;font-weight:700;text-align:right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Game</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${gameName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Service</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${serviceName}</td>
                  </tr>
                  ${details ? `
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Details</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${details}</td>
                  </tr>` : ''}
                  <tr style="border-top:1px solid #222;">
                    <td style="padding:10px 0 0;color:#fff;font-size:15px;font-weight:700;">Total</td>
                    <td style="padding:10px 0 0;color:#f5c518;font-size:18px;font-weight:800;text-align:right;">$${price}</td>
                  </tr>
                </table>
              </div>

              <p style="color:#555;font-size:13px;margin:0;">Your order will be assigned to one of our boosters and picked up shortly.</p>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <p style="margin:0;color:#777;font-size:13px;">To track your order:</p>
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;margin-top:12px;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Go to Dashboard →</a>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

export async function sendOrderStatusUpdate({ to, username, orderNumber, gameName, serviceName, status }) {
  const STATUS_LABELS = {
    pending: 'Back in Queue',
    assigned: 'Booster Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const STATUS_COLORS = {
    pending: '#f5c518',
    assigned: '#ffcc44',
    in_progress: '#44aaff',
    completed: '#4caf50',
    cancelled: '#ff6666',
  }

  const STATUS_MESSAGES = {
    pending: 'Your order was returned to the queue and will be picked up by another booster shortly. No action is needed on your end.',
    assigned: 'Your order has been assigned to a booster. It will be picked up shortly.',
    in_progress: "Your order is now actively being worked on. You'll be notified once it's complete.",
    completed: "Your order was completed successfully! Don't forget to rate your experience.",
    cancelled: 'Your order was cancelled. Reach out to our support team if you have any questions.',
  }

  const label = STATUS_LABELS[status] || status
  const color = STATUS_COLORS[status] || '#f5c518'
  const message = STATUS_MESSAGES[status] || ''

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Order Updated — ${label} | ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;">
              <div style="display:inline-block;background:${color}22;border:1px solid ${color}44;border-radius:8px;padding:6px 14px;margin-bottom:16px;">
                <span style="color:${color};font-size:13px;font-weight:700;">${label}</span>
              </div>

              <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#fff;">Order Status Updated</h1>
              <p style="color:#777;margin:0 0 20px;font-size:14px;">Hi ${username}, there's an update on order ${orderNumber}.</p>

              <div style="background:#0a0a0a;border-radius:10px;padding:16px;margin-bottom:16px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Order #</td>
                    <td style="padding:6px 0;color:#f5c518;font-size:13px;font-weight:700;text-align:right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Game</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${gameName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Service</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">New Status</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:700;text-align:right;color:${color};">${label}</td>
                  </tr>
                </table>
              </div>

              <p style="color:#555;font-size:13px;margin:0;">${message}</p>
            </div>

            ${status === 'completed' ? `
            <div style="background:#111;border:1px solid #f5c51844;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
              <p style="margin:0 0 12px;color:#fff;font-size:14px;font-weight:600;">Rate your experience! ⭐</p>
              <p style="margin:0 0 16px;color:#777;font-size:13px;">Your feedback means a lot to our team.</p>
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Leave a Review →</a>
            </div>` : `
            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Track Your Order →</a>
            </div>`}

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

// Alerts the team inbox the moment someone applies via "Work with us" — before
// this, an application only showed up if someone happened to check the admin
// panel. Silently no-ops if ADMIN_NOTIFICATION_EMAIL isn't configured.
export async function sendNewApplicationAdminEmail({ type, username, userEmail, discord, gameNames }) {
  if (!ADMIN_EMAIL) return
  const roleLabel = type === 'booster' ? 'Booster' : 'Content Creator'
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New ${roleLabel} application — ${username}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;">
              <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;">New ${roleLabel} Application</h1>
              <p style="color:#777;margin:0 0 20px;font-size:14px;">${username} just applied. Review it in the admin panel.</p>

              <table style="width:100%;border-collapse:collapse;background:#0a0a0a;border-radius:10px;padding:16px;">
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">User</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${username} (${userEmail})</td></tr>
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Discord</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${discord || '—'}</td></tr>
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Games</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${gameNames || '—'}</td></tr>
              </table>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <a href="https://shadowboosting.co/admin" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Review Application →</a>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

// Fires when an admin approves or rejects an application — the applicant's
// only signal besides logging back in to check (the in-app notification
// alone requires an active session to be seen).
export async function sendApplicationDecisionEmail({ to, username, type, decision, reviewNote }) {
  const roleLabel = type === 'booster' ? 'Booster' : 'Content Creator'
  const approved = decision === 'approved'
  const color = approved ? '#4caf50' : '#ff6666'
  const label = approved ? 'Approved' : 'Not Approved'

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your ${roleLabel} application — ${label}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
              <div style="display:inline-block;background:${color}22;border:1px solid ${color}44;border-radius:8px;padding:6px 14px;margin-bottom:16px;">
                <span style="color:${color};font-size:13px;font-weight:700;">${label}</span>
              </div>
              <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#fff;">${roleLabel} Application ${label}</h1>
              <p style="color:#777;margin:0 0 8px;font-size:14px;">
                ${approved
                  ? `Hi ${username}, congrats — your ${roleLabel.toLowerCase()} application was approved!`
                  : `Hi ${username}, your ${roleLabel.toLowerCase()} application wasn't approved this time.`}
              </p>
              ${reviewNote ? `<p style="color:#555;font-size:13px;margin:12px 0 0;">${reviewNote}</p>` : ''}
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">${approved ? 'Go to Dashboard →' : 'View Application →'}</a>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

// Alerts the team inbox when a customer reports a problem with an order —
// mirrors sendNewApplicationAdminEmail's pattern of an ADMIN_EMAIL-gated,
// silent-no-op alert so it's safe to call from a request path unconditionally.
export async function sendOrderIssueAdminEmail({ orderNumber, gameName, serviceName, username, message }) {
  if (!ADMIN_EMAIL) return
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Issue reported — order ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;">
              <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;">Customer reported an issue</h1>
              <p style="color:#777;margin:0 0 20px;font-size:14px;">${username} needs help with order ${orderNumber}.</p>

              <table style="width:100%;border-collapse:collapse;background:#0a0a0a;border-radius:10px;padding:16px;margin-bottom:16px;">
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Order #</td><td style="padding:6px 16px;color:#f5c518;font-size:13px;font-weight:700;text-align:right;">${orderNumber}</td></tr>
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Game</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${gameName || '—'}</td></tr>
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Service</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${serviceName || '—'}</td></tr>
              </table>

              <div style="background:#0a0a0a;border-left:3px solid #ff6666;border-radius:6px;padding:12px 16px;">
                <p style="color:#ccc;font-size:13px;margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <a href="https://shadowboosting.co/admin" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Open Admin Panel →</a>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

// Alerts the team inbox when someone submits the public contact form.
export async function sendContactFormAdminEmail({ name, email, orderNumber, message }) {
  if (!ADMIN_EMAIL) return
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: orderNumber ? `Contact form — order ${orderNumber}` : `Contact form — ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;">
              <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;">New contact form message</h1>

              <table style="width:100%;border-collapse:collapse;background:#0a0a0a;border-radius:10px;padding:16px;margin-bottom:16px;">
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Name</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${escapeHtml(name)}</td></tr>
                <tr><td style="padding:6px 16px;color:#555;font-size:13px;">Email</td><td style="padding:6px 16px;color:#fff;font-size:13px;text-align:right;">${escapeHtml(email)}</td></tr>
                ${orderNumber ? `<tr><td style="padding:6px 16px;color:#555;font-size:13px;">Order #</td><td style="padding:6px 16px;color:#f5c518;font-size:13px;font-weight:700;text-align:right;">${escapeHtml(orderNumber)}</td></tr>` : ''}
              </table>

              <div style="background:#0a0a0a;border-left:3px solid #f5c518;border-radius:6px;padding:12px 16px;">
                <p style="color:#ccc;font-size:13px;margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
              </div>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}

// Fires on every new order-thread message — previously in-app only, so the
// recipient only found out if they happened to be logged in and looking.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function sendNewMessageEmail({ to, username, senderUsername, orderNumber, messagePreview, link }) {
  const preview = escapeHtml(messagePreview).slice(0, 200)
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `New message from ${senderUsername} — ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:#f5c518;border-radius:10px;padding:10px 20px;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;">ShadowBoosting</span>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:20px;">
              <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;">New message from ${senderUsername}</h1>
              <p style="color:#777;margin:0 0 16px;font-size:14px;">Hi ${username}, you have a new message on order ${orderNumber}.</p>
              <div style="background:#0a0a0a;border-left:3px solid #f5c518;border-radius:6px;padding:12px 16px;">
                <p style="color:#ccc;font-size:13px;margin:0;white-space:pre-wrap;">${preview}</p>
              </div>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <a href="https://shadowboosting.co${link}" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Reply →</a>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ShadowBoosting.co — Forge Your Power in the Shadows
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
  }
}
