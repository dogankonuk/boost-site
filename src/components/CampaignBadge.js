// Compact "-X%" pill shared by every price-list surface (service cards,
// homepage strips, nav search/menu) so an active campaign reads the same
// way everywhere, distinct from the gold used for loyalty/coupon discounts.
export default function CampaignBadge({ pct, style }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px',
      background: 'rgba(147,51,234,0.15)', color: 'var(--violet)', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-montserrat)',
      ...style,
    }}>🔥 -{pct}%</span>
  )
}
