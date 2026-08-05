'use client'
import Skeleton from 'react-loading-skeleton'

// A generic table-shaped skeleton used across the admin panel's loading
// states (orders, games, users, boosters, blog, applications, promotions) —
// they all render a heading + a list of rows, so one shape covers them all.
export default function AdminSkeleton({ rows = 6, title = true }) {
  return (
    <div>
      {title && <Skeleton height={26} width={200} style={{ marginBottom: 20 }} />}
      <Skeleton height={38} borderRadius={8} style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={48} borderRadius={8} style={{ marginBottom: 8 }} />
      ))}
    </div>
  )
}
