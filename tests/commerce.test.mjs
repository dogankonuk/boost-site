import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculatePrice,
  normalizeSelection,
} from '../src/lib/pricing.js'
import { buildCheckoutError } from '../src/lib/cartCheckout.js'
import { sanitizeCartItems } from '../src/lib/cartStorage.js'
import { buildDashboardTabUrl } from '../src/lib/dashboardNavigation.js'

test('quantity selection clamps and snaps from the configured minimum', () => {
  const options = {
    type: 'quantity',
    minQty: 5,
    maxQty: 50,
    step: 5,
    unitPrice: 2,
  }

  assert.equal(normalizeSelection(options, { quantity: 12 }).quantity, 10)
  assert.equal(normalizeSelection(options, { quantity: 49 }).quantity, 50)
  assert.equal(normalizeSelection(options, { quantity: 999 }).quantity, 50)
})

test('range selection keeps an ordered, stepped interval', () => {
  const options = {
    type: 'range',
    min: 0,
    max: 100,
    step: 10,
    pricePerUnit: 1,
  }

  assert.deepEqual(
    normalizeSelection(options, { from: 16, to: 87 }),
    { from: 20, to: 90 },
  )
  assert.deepEqual(
    normalizeSelection(options, { from: 999, to: -10 }),
    { from: 90, to: 100 },
  )
})

test('quantity price applies the highest qualifying volume discount', () => {
  const options = {
    type: 'quantity',
    minQty: 1,
    maxQty: 100,
    unitPrice: 2,
    volumeDiscounts: [
      { minQty: 10, discountPct: 5 },
      { minQty: 20, discountPct: 10 },
    ],
  }

  assert.equal(calculatePrice(options, 0, { quantity: 20 }), 36)
})

test('range price sums configured price bands after normalization', () => {
  const options = {
    type: 'range',
    min: 1,
    max: 30,
    step: 1,
    pricePerUnit: 3,
    tiers: [
      { upTo: 10, pricePerUnit: 1 },
      { upTo: 20, pricePerUnit: 2 },
    ],
  }

  assert.equal(calculatePrice(options, 0, { from: 5, to: 25 }), 40)
})

test('checkout error explains when no orders were placed', () => {
  assert.equal(
    buildCheckoutError([
      { name: 'Power Leveling', reason: 'This coupon has expired' },
      { name: 'Currency', reason: 'This coupon has expired' },
    ], 0),
    'No orders were placed. This coupon has expired',
  )
})

test('checkout error reports partial success without claiming every item succeeded', () => {
  assert.equal(
    buildCheckoutError([
      { name: 'Currency', reason: 'The order could not be created.' },
    ], 2),
    '2 orders were placed successfully. Could not place: Currency.',
  )
})

test('stored cart ignores malformed data instead of breaking cart consumers', () => {
  assert.deepEqual(sanitizeCartItems({ serviceId: 23 }), [])
  assert.deepEqual(sanitizeCartItems([null, 'invalid', { serviceId: 23, price: 'nope', serviceName: 'Leveling' }]), [])
})

test('stored cart restores valid items with numeric prices and removable ids', () => {
  assert.deepEqual(
    sanitizeCartItems([{ serviceId: '23', serviceName: 'Power Leveling', price: '63.00' }]),
    [{ serviceId: 23, serviceName: 'Power Leveling', price: 63, cartId: 'restored-23-0' }],
  )
})

test('stored cart preserves a valid discount breakdown but drops a bogus one', () => {
  assert.deepEqual(
    sanitizeCartItems([{ serviceId: 23, serviceName: 'Power Leveling', price: 70, originalPrice: 100, discountAmount: 30, discountSource: 'campaign' }]),
    [{ serviceId: 23, serviceName: 'Power Leveling', price: 70, originalPrice: 100, discountAmount: 30, discountSource: 'campaign', cartId: 'restored-23-0' }],
  )
  assert.deepEqual(
    sanitizeCartItems([{ serviceId: 23, serviceName: 'Power Leveling', price: 70, originalPrice: 50, discountAmount: -10 }]),
    [{ serviceId: 23, serviceName: 'Power Leveling', price: 70, cartId: 'restored-23-0' }],
  )
})

test('dashboard tab URLs survive refresh and discard stale order highlights', () => {
  assert.equal(
    buildDashboardTabUrl('orderId=42', 'orders'),
    '/dashboard?tab=orders',
  )
  assert.equal(
    buildDashboardTabUrl('tab=orders&orderId=42', 'overview'),
    '/dashboard',
  )
})
