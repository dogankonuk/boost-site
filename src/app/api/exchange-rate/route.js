import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.EXCHANGE_API_KEY
    if (!key) {
      return NextResponse.json({ success: false, error: 'EXCHANGE_API_KEY is not set' }, { status: 500 })
    }

    // Base currency is now USD, since that's what basePrice values are entered in.
    // conversion_rates.TRY/EUR = how many TRY/EUR equal 1 USD.
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`, {
      next: { revalidate: 3600 }, // cache for 1 hour on the server too
    })
    const data = await res.json()

    if (data.result !== 'success') {
      return NextResponse.json({ success: false, error: data['error-type'] || 'exchange rate fetch failed' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      rates: {
        TRY: data.conversion_rates.TRY,
        EUR: data.conversion_rates.EUR,
      },
      updatedAt: data.time_last_update_utc,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
