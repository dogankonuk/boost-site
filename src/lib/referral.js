import { prisma } from './prisma'
import { notifyReferralBonus } from './notify'

const REFERRAL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I
export const REFERRER_BONUS_POINTS = 100
export const REFERRED_BONUS_POINTS = 50

export async function generateReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 7; i++) code += REFERRAL_CODE_CHARS[Math.floor(Math.random() * REFERRAL_CODE_CHARS.length)]
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique referral code')
}

// Lazily backfills a referral code for users created before this feature existed.
export async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode
  const code = await generateReferralCode()
  await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
  return code
}

// Fires the first time a referred user's order is marked completed.
export async function maybeAwardReferralBonus(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.referredById || user.referralRewardGiven) return

  const completedCount = await prisma.order.count({ where: { userId, status: 'completed' } })
  if (completedCount !== 1) return

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { referralRewardGiven: true, bonusPoints: { increment: REFERRED_BONUS_POINTS } },
    }),
    prisma.user.update({
      where: { id: user.referredById },
      data: { bonusPoints: { increment: REFERRER_BONUS_POINTS } },
    }),
  ])

  // Best-effort — a notification hiccup shouldn't undo the points already awarded.
  await Promise.all([
    notifyReferralBonus(prisma, { userId: user.id, points: REFERRED_BONUS_POINTS, role: 'referred' }),
    notifyReferralBonus(prisma, { userId: user.referredById, points: REFERRER_BONUS_POINTS, role: 'referrer' }),
  ])
}
