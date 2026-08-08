// Shared between the client (live price preview in OrderForm) and the server
// (authoritative price + discount computation in /api/orders) so both sides
// always agree on what a given selection actually costs.

export function round2(n) {
  return Math.round(n * 100) / 100
}

// Sums marginal cost across price bands (options.tiers, sorted ascending by upTo).
// Any span beyond the last defined band falls back to the flat options.pricePerUnit.
export function calculateTieredRangeCost(options, from, to) {
  if (to <= from) return 0
  if (!options.tiers || options.tiers.length === 0) {
    return (to - from) * options.pricePerUnit
  }
  let cost = 0
  let prevBound = options.min
  for (const band of options.tiers) {
    const segStart = Math.max(from, prevBound)
    const segEnd = Math.min(to, band.upTo)
    if (segEnd > segStart) cost += (segEnd - segStart) * band.pricePerUnit
    prevBound = band.upTo
    if (prevBound >= to) return cost
  }
  if (prevBound < to) cost += (to - prevBound) * options.pricePerUnit
  return cost
}

// Highest-qualifying threshold wins (options.volumeDiscounts, sorted ascending by minQty).
export function calculateVolumeDiscountPct(options, quantity) {
  if (!options.volumeDiscounts || options.volumeDiscounts.length === 0) return 0
  let pct = 0
  for (const tier of options.volumeDiscounts) {
    if (quantity >= tier.minQty) pct = tier.discountPct
  }
  return pct
}

export function calculatePrice(options, basePrice, selection) {
  if (!options || options.type === 'fixed') return basePrice
  if (options.type === 'quantity') {
    const qty = Math.max(options.minQty, selection.quantity || options.minQty)
    const base = qty * options.unitPrice
    const discountPct = calculateVolumeDiscountPct(options, qty)
    return discountPct > 0 ? round2(base * (1 - discountPct / 100)) : base
  }
  if (options.type === 'range') {
    const from = parseInt(selection.from || options.min)
    const to = parseInt(selection.to || options.min + 1)
    return calculateTieredRangeCost(options, from, to)
  }
  if (options.type === 'options') {
    const choice = options.choices?.find(c => c.label === selection.choice)
    return choice ? choice.price : basePrice
  }
  return basePrice
}

// Per-service admin-defined extras (delivery method, priority speed, add-on
// items, etc). selectedAddons is { [group.key]: value } for 'select' groups
// or { [group.key]: [values] } for 'multiselect' groups. Choices with no
// priceDelta (e.g. Piloted vs Self-play) are free — this is how a purely
// informational choice and a real paid upsell share the same mechanism.
export function calculateAddonsCost(addons, selectedAddons, basePrice) {
  if (!Array.isArray(addons) || !selectedAddons) return 0
  let total = 0
  for (const group of addons) {
    const selected = selectedAddons[group.key]
    if (selected == null) continue
    const values = Array.isArray(selected) ? selected : [selected]
    for (const val of values) {
      const choice = group.choices?.find(c => c.value === val)
      if (!choice || !choice.priceDelta) continue
      total += choice.priceType === 'percent'
        ? basePrice * (choice.priceDelta / 100)
        : choice.priceDelta
    }
  }
  return round2(total)
}

// Turns raw selectedAddons values into a self-describing snapshot (group +
// choice labels, and what each choice actually cost) so order history stays
// readable and accurate even if the service's addons are edited/removed later.
export function resolveAddonsSnapshot(addons, selectedAddons, basePrice) {
  if (!Array.isArray(addons) || !selectedAddons) return null
  const snapshot = {}
  for (const group of addons) {
    const selected = selectedAddons[group.key]
    if (selected == null) continue
    const values = Array.isArray(selected) ? selected : [selected]
    const resolvedValues = values
      .map(val => group.choices?.find(c => c.value === val))
      .filter(Boolean)
      .map(choice => ({
        value: choice.value,
        label: choice.label,
        priceDelta: choice.priceDelta || 0,
        priceType: choice.priceType || 'flat',
        cost: round2(choice.priceType === 'percent' ? basePrice * ((choice.priceDelta || 0) / 100) : (choice.priceDelta || 0)),
      }))
    if (resolvedValues.length > 0) {
      snapshot[group.key] = { label: group.label, values: resolvedValues }
    }
  }
  return Object.keys(snapshot).length > 0 ? snapshot : null
}

// A campaign applies if it's active, within its date window, and either
// site-wide (no gameId) or restricted to the game being ordered.
export function isCampaignEligible(campaign, gameId) {
  if (!campaign || !campaign.isActive) return false
  if (campaign.gameId && campaign.gameId !== gameId) return false
  const now = new Date()
  if (campaign.startsAt && now < new Date(campaign.startsAt)) return false
  if (campaign.endsAt && now > new Date(campaign.endsAt)) return false
  return true
}

// Returns { ok: true } or { ok: false, error } — always re-run this
// server-side before creating an order, never trust a client-side preview.
export function isCouponEligible(coupon, { gameId, subtotal, userRedemptionCount = 0 } = {}) {
  if (!coupon || !coupon.isActive) return { ok: false, error: 'Invalid or inactive coupon code' }
  const now = new Date()
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return { ok: false, error: 'This coupon is not active yet' }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return { ok: false, error: 'This coupon has expired' }
  if (coupon.gameId && gameId && coupon.gameId !== gameId) return { ok: false, error: 'This coupon is not valid for this game' }
  if (coupon.minSpend && subtotal < coupon.minSpend) return { ok: false, error: `Minimum spend of $${coupon.minSpend} required` }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { ok: false, error: 'This coupon has reached its usage limit' }
  if (coupon.perUserLimit != null && userRedemptionCount >= coupon.perUserLimit) return { ok: false, error: 'You have already used this coupon' }
  return { ok: true }
}

// Picks the single best-for-the-customer discount among loyalty tier, an
// active campaign, and a validated coupon — deliberately never stacks them.
// Comparing resulting discount *amount* (not just %) makes percent and
// fixed-amount coupons compare correctly against each other.
export function resolveBestDiscount({ basePrice, loyaltyPct = 0, campaignPct = 0, coupon = null }) {
  const candidates = []
  if (loyaltyPct > 0) {
    candidates.push({ source: 'loyalty', amount: round2(basePrice * (loyaltyPct / 100)) })
  }
  if (campaignPct > 0) {
    candidates.push({ source: 'campaign', amount: round2(basePrice * (campaignPct / 100)) })
  }
  if (coupon) {
    const amount = coupon.type === 'percent'
      ? round2(basePrice * (coupon.value / 100))
      : Math.min(coupon.value, basePrice)
    candidates.push({ source: 'coupon', amount: round2(amount) })
  }

  if (candidates.length === 0) {
    return { finalPrice: round2(basePrice), discountAmount: 0, source: null }
  }

  const best = candidates.reduce((a, b) => (b.amount > a.amount ? b : a))
  const finalPrice = Math.max(0, round2(basePrice - best.amount))
  return { finalPrice, discountAmount: round2(basePrice - finalPrice), source: best.source }
}
