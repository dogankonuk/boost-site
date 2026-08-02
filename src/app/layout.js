import './globals.css'
import { Montserrat, Inter } from 'next/font/google'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { CartProvider } from '@/context/CartContext'

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
  title: {
    default: 'ShadowBoosting.co — Forge Your Power in the Shadows',
    template: '%s | ShadowBoosting.co',
  },
  description: 'Professional game boosting services. Safe, fast, guaranteed.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CurrencyProvider>
          <CartProvider>
            <div style={{ flex: 1 }}>
              {children}
            </div>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}