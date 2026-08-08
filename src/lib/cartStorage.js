export function sanitizeCartItems(value) {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []

    const serviceId = Number(item.serviceId)
    const price = Number(item.price)
    if (!Number.isInteger(serviceId) || serviceId <= 0) return []
    if (!Number.isFinite(price) || price < 0) return []
    if (typeof item.serviceName !== 'string' || !item.serviceName.trim()) return []

    return [{
      ...item,
      serviceId,
      price,
      cartId: typeof item.cartId === 'string' && item.cartId
        ? item.cartId
        : `restored-${serviceId}-${index}`,
    }]
  })
}
