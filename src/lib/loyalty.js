export const LOYALTY_TIERS = [
  { name: 'Bronze', minPoints: 0, discount: 0, color: '#cd7f32', icon: '🥉' },
  { name: 'Silver', minPoints: 250, discount: 3, color: '#c8c8d4', icon: '🥈' },
  { name: 'Gold', minPoints: 750, discount: 6, color: '#f5c518', icon: '🥇' },
  { name: 'Platinum', minPoints: 2000, discount: 10, color: '#9be7ff', icon: '💎' },
]

// 1 point earned per $1 of lifetime non-cancelled order spend, plus any bonus points
// (e.g. referral rewards) stored directly on the user.
export function pointsFromSpend(totalSpent) {
  return Math.floor(totalSpent || 0)
}

export function getLoyaltyTier(points) {
  const pts = points || 0
  let idx = 0
  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    if (pts >= LOYALTY_TIERS[i].minPoints) idx = i
  }
  const tier = LOYALTY_TIERS[idx]
  const next = LOYALTY_TIERS[idx + 1] || null

  return {
    ...tier,
    points: pts,
    next,
    progress: next ? Math.min(1, (pts - tier.minPoints) / (next.minPoints - tier.minPoints)) : 1,
    remaining: next ? Math.max(0, next.minPoints - pts) : 0,
  }
}
