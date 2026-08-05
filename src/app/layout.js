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
import JsonLd from '@/components/JsonLd'

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

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ShadowBoosting.co — Forge Your Power in the Shadows',
    template: '%s | ShadowBoosting.co',
  },
  description: 'Professional game boosting services. Safe, fast, guaranteed.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ShadowBoosting.co — Forge Your Power in the Shadows',
    description: 'Professional game boosting services. Safe, fast, guaranteed.',
    url: SITE_URL,
    siteName: 'ShadowBoosting.co',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShadowBoosting.co — Forge Your Power in the Shadows',
    description: 'Professional game boosting services. Safe, fast, guaranteed.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              name: 'ShadowBoosting.co',
              url: SITE_URL,
              description: 'Professional game boosting services. Safe, fast, guaranteed.',
            },
            {
              '@type': 'WebSite',
              url: SITE_URL,
              name: 'ShadowBoosting.co',
            },
          ],
        }} />
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