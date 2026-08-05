import './globals.css'
import 'nprogress/nprogress.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { Suspense } from 'react'
import { Chakra_Petch, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { SkeletonTheme } from 'react-loading-skeleton'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { CartProvider } from '@/context/CartContext'
import RouteProgress from '@/components/RouteProgress'

const montserrat = Chakra_Petch({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['500', '600', '700'],
})

const inter = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
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
            <SkeletonTheme baseColor="#1a1a1a" highlightColor="#2a2a2a">
              <div style={{ flex: 1 }}>
                {children}
              </div>
            </SkeletonTheme>
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