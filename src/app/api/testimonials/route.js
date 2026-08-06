import { NextResponse } from 'next/server'
import { getTrustStats } from '@/lib/trustStats'
import { getTestimonials } from '@/lib/testimonials'

// Public, read-only: surfaces real customer feedback (written reviews on
// completed orders) plus site-wide trust stats, without exposing anything
// beyond username/service/game — no price, email, or other order details.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit')) || 8, 20)

    const [data, stats] = await Promise.all([
      getTestimonials(limit),
      getTrustStats(),
    ])

    return NextResponse.json({ success: true, data, stats })
  } catch (error) {
    console.error('Testimonials GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
