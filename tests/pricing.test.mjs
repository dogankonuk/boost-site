import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculatePrice,
  normalizeSelection,
} from '../src/lib/pricing.js'

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
