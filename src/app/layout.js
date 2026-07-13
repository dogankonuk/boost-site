import './globals.css'
import { Montserrat, Inter } from 'next/font/google'
import { CurrencyProvider } from '@/context/CurrencyContext'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
})

export const metadata = {
  title: 'ShadowBoosting.co — Forge Your Power in the Shadows',
  description: 'Profesyonel oyun boost hizmetleri. Güvenli, hızlı, garantili.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${montserrat.variable} ${inter.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CurrencyProvider>
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </CurrencyProvider>
      </body>
    </html>
  )
}