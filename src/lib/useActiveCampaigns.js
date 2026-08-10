'use client'
import { useState, useEffect } from 'react'

// Shared by every customer-facing surface that lists a price (game service
// grids, homepage strips, nav search/menu) so an active campaign's discount
// shows up everywhere a price is shown, not just the order/cart pages.
export function useActiveCampaigns() {
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    fetch('/api/campaigns/active').then(res => res.json()).then(d => {
      if (d?.success) setCampaigns(d.data)
    }).catch(() => {})
  }, [])

  return campaigns
}
