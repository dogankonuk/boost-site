export function buildCheckoutError(failed, placedCount) {
  const failedNames = failed.map(item => item.name).join(', ')
  const reasons = [...new Set(failed.map(item => item.reason))]

  if (placedCount === 0) {
    const reason = reasons.length === 1
      ? reasons[0]
      : 'Please review your cart and try again.'
    return `No orders were placed. ${reason}`
  }

  return `${placedCount} ${placedCount === 1 ? 'order was' : 'orders were'} placed successfully. Could not place: ${failedNames}.`
}
