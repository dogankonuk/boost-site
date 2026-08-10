export function sanitizeCartItems(value) {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []

    const serviceId = Number(item.serviceId)
    const price = Number(item.price)
    if (!Number.isInteger(serviceId) || serviceId <= 0) return []
    if (!Number.isFinite(price) || price < 0) return []
    if (typeof item.serviceName !== 'string' || !item.serviceName.trim()) return []

    const originalPrice = Number(item.originalPrice)
    const discountAmount = Number(item.discountAmount)
    const hasDiscount = Number.isFinite(originalPrice) && originalPrice >= price
      && Number.isFinite(discountAmount) && discountAmount > 0

    const { originalPrice: _op, discountAmount: _da, discountSource: _ds, discountLabel: _dl, ...rest } = item

    return [{
      ...rest,
      serviceId,
      price,
      ...(hasDiscount && {
        originalPrice,
        discountAmount,
        ...(typeof item.discountSource === 'string' && { discountSource: item.discountSource }),
        ...(typeof item.discountLabel === 'string' && item.discountLabel && { discountLabel: item.discountLabel }),
      }),
      cartId: typeof item.cartId === 'string' && item.cartId
        ? item.cartId
        : `restored-${serviceId}-${index}`,
    }]
  })
}
