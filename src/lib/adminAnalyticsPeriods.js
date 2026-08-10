export const MAX_CUSTOM_RANGE_DAYS = 92

function startOfWeek(dateValue) {
  const date = new Date(dateValue)
  date.setUTCHours(0, 0, 0, 0)
  const day = date.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  date.setUTCDate(date.getUTCDate() + diff)
  return date
}

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function parseUtcDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (date.toISOString().slice(0, 10) !== value) return null
  return date
}

export function buildPeriodBuckets(period, startDateParam, endDateParam, nowValue = new Date()) {
  const now = new Date(nowValue)
  const buckets = []
  let rangeStart

  if (period === 'custom' && startDateParam && endDateParam) {
    let start = parseUtcDate(startDateParam)
    let end = parseUtcDate(endDateParam)
    if (!start || !end) {
      end = new Date(now); end.setUTCHours(0, 0, 0, 0)
      start = new Date(end); start.setUTCDate(start.getUTCDate() - 13)
    }
    if (end < start) { const tmp = start; start = end; end = tmp }
    const spanDays = Math.round((end - start) / 86400000)
    if (spanDays >= MAX_CUSTOM_RANGE_DAYS) end = new Date(start.getTime() + (MAX_CUSTOM_RANGE_DAYS - 1) * 86400000)
    for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      const key = date.toISOString().slice(0, 10)
      buckets.push({ key, date: key, revenue: 0, orders: 0, byGame: {}, byService: {} })
    }
    rangeStart = start
  } else if (period === '12w') {
    const thisWeekStart = startOfWeek(now)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(thisWeekStart); date.setUTCDate(date.getUTCDate() - i * 7)
      const key = date.toISOString().slice(0, 10)
      buckets.push({ key, date: key, revenue: 0, orders: 0, byGame: {}, byService: {} })
    }
    rangeStart = new Date(buckets[0].date)
  } else if (period === '12m') {
    for (let i = 11; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      buckets.push({ key: monthKey(date), date: date.toISOString().slice(0, 10), revenue: 0, orders: 0, byGame: {}, byService: {} })
    }
    rangeStart = new Date(buckets[0].date)
  } else {
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now); date.setUTCHours(0, 0, 0, 0); date.setUTCDate(date.getUTCDate() - i)
      const key = date.toISOString().slice(0, 10)
      buckets.push({ key, date: key, revenue: 0, orders: 0, byGame: {}, byService: {} })
    }
    rangeStart = new Date(buckets[0].date)
  }

  const bucketIndex = Object.fromEntries(buckets.map((bucket, index) => [bucket.key, index]))
  function bucketKeyFor(date) {
    if (period === '12w') return startOfWeek(date).toISOString().slice(0, 10)
    if (period === '12m') return monthKey(date)
    return date.toISOString().slice(0, 10)
  }

  return { buckets, bucketIndex, bucketKeyFor, rangeStart }
}
