import './globals.css'
import 'nprogress/nprogress.css'
import { Suspense } from 'react'
import { Montserrat, Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { CartProvider } from '@/context/CartContext'
import RouteProgress from '@/components/RouteProgress'

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
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <CurrencyProvider>
          <CartProvider>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  color: '#fff',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '13px',
                },
                success: { iconTheme: { primary: '#f5c518', secondary: '#0a0a0a' } },
              }}
            />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}