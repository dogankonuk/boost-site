export function buildDashboardTabUrl(currentQuery, nextTab) {
  const params = new URLSearchParams(currentQuery || '')
  if (nextTab === 'overview') params.delete('tab')
  else params.set('tab', nextTab)
  params.delete('orderId')

  const query = params.toString()
  return query ? `/dashboard?${query}` : '/dashboard'
}
