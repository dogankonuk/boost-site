import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function sendOrderConfirmation({ to, username, orderNumber, gameName, serviceName, price, details }) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Siparişiniz Alındı — ${orderNumber}`,
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
              <h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#fff;">Siparişiniz Alındı! 🎮</h1>
              <p style="color:#777;margin:0 0 24px;font-size:14px;">Merhaba ${username}, siparişiniz başarıyla oluşturuldu.</p>
              
              <div style="background:#0a0a0a;border-radius:10px;padding:16px;margin-bottom:16px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Sipariş No</td>
                    <td style="padding:6px 0;color:#f5c518;font-size:13px;font-weight:700;text-align:right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Oyun</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${gameName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Hizmet</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${serviceName}</td>
                  </tr>
                  ${details ? `
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Detay</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${details}</td>
                  </tr>` : ''}
                  <tr style="border-top:1px solid #222;">
                    <td style="padding:10px 0 0;color:#fff;font-size:15px;font-weight:700;">Toplam</td>
                    <td style="padding:10px 0 0;color:#f5c518;font-size:18px;font-weight:800;text-align:right;">$${price}</td>
                  </tr>
                </table>
              </div>

              <p style="color:#555;font-size:13px;margin:0;">Siparişiniz en kısa sürede booster ekibimize atanacak ve işleme alınacaktır.</p>
            </div>

            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <p style="margin:0;color:#777;font-size:13px;">Siparişinizi takip etmek için:</p>
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;margin-top:12px;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Dashboard'a Git →</a>
            </div>

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © 2024 ShadowBoosting.co — Forge Your Power in the Shadows!
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Email gönderilemedi:', err)
  }
}

export async function sendOrderStatusUpdate({ to, username, orderNumber, gameName, serviceName, status }) {
  const STATUS_LABELS = {
    assigned: 'Booster Atandı',
    in_progress: 'İşleme Alındı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
  }

  const STATUS_COLORS = {
    assigned: '#ffcc44',
    in_progress: '#44aaff',
    completed: '#4caf50',
    cancelled: '#ff6666',
  }

  const STATUS_MESSAGES = {
    assigned: 'Siparişiniz bir booster\'a atandı. Kısa süre içinde işleme alınacak.',
    in_progress: 'Siparişiniz şu an aktif olarak işleniyor. Tamamlanınca bildirim alacaksınız.',
    completed: 'Siparişiniz başarıyla tamamlandı! Deneyiminizi değerlendirmeyi unutmayın.',
    cancelled: 'Siparişiniz iptal edildi. Sorularınız için destek ekibimize ulaşabilirsiniz.',
  }

  const label = STATUS_LABELS[status] || status
  const color = STATUS_COLORS[status] || '#f5c518'
  const message = STATUS_MESSAGES[status] || ''

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Sipariş Güncellendi — ${label} | ${orderNumber}`,
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
              
              <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#fff;">Sipariş Durumu Güncellendi</h1>
              <p style="color:#777;margin:0 0 20px;font-size:14px;">Merhaba ${username}, ${orderNumber} numaralı siparişinizde güncelleme var.</p>

              <div style="background:#0a0a0a;border-radius:10px;padding:16px;margin-bottom:16px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Sipariş No</td>
                    <td style="padding:6px 0;color:#f5c518;font-size:13px;font-weight:700;text-align:right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Oyun</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${gameName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Hizmet</td>
                    <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:13px;">Yeni Durum</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:700;text-align:right;color:${color};">${label}</td>
                  </tr>
                </table>
              </div>

              <p style="color:#555;font-size:13px;margin:0;">${message}</p>
            </div>

            ${status === 'completed' ? `
            <div style="background:#111;border:1px solid #f5c51844;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
              <p style="margin:0 0 12px;color:#fff;font-size:14px;font-weight:600;">Deneyiminizi değerlendirin! ⭐</p>
              <p style="margin:0 0 16px;color:#777;font-size:13px;">Geri bildiriminiz ekibimiz için çok değerli.</p>
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Değerlendirme Yap →</a>
            </div>` : `
            <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:20px;">
              <a href="https://shadowboosting.co/dashboard" style="display:inline-block;background:#f5c518;color:#0a0a0a;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Siparişi Takip Et →</a>
            </div>`}

            <p style="text-align:center;color:#333;font-size:12px;margin:0;">
              © 2024 ShadowBoosting.co — Forge Your Power in the Shadows!
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('Email gönderilemedi:', err)
  }
}