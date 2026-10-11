import { gaussian, mulberry32 } from "@/lib/neural-net"

/**
 * Synthetic, illustrative card payments: 2% fraud (heavily imbalanced) and a 10% minority
 * customer group, with a fraud model's score for each payment.
 */
export const PAYMENT_COUNT = 1000
export const FRAUD_RATE = 0.02
export const MINORITY_RATE = 0.1

export const payments = (() => {
  const rand = mulberry32(77)
  const frauds = Math.round(PAYMENT_COUNT * FRAUD_RATE)
  return Array.from({ length: PAYMENT_COUNT }, (_, i) => {
    const fraud = i < frauds
    const group = rand() < MINORITY_RATE ? "B" : "A"
    const raw = (fraud ? 0.55 : 0.2) + (fraud ? 0.18 : 0.12) * gaussian(rand)
    return { fraud, group, score: Math.min(0.99, Math.max(0.01, raw)) }
  })
})()
export const paymentFraud = payments.map((p) => p.fraud)
export const paymentScores = payments.map((p) => p.score)
