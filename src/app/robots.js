const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/booster',
        '/dashboard',
        '/cart',
        '/notifications',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/oauth-complete',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
