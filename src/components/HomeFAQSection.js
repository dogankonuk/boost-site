'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Reveal from './motion/Reveal'
import JsonLd from './JsonLd'

// Trust/objection-handling FAQ — the questions a first-time visitor is
// actually weighing before they buy, not the operational FAQ on /faq.
const FAQS = [
  {
    q: 'Is it safe to use a boosting service?',
    a: 'Yes. Every session runs through region-matched VPN protection, and our boosters follow strict account-safety practices — we never ask for more access than a service actually requires.',
  },
  {
    q: 'Will I get banned for boosting?',
    a: "We treat account safety as the top priority on every order: VPN-protected sessions, no third-party tools, and discreet, professional play that matches your normal habits as closely as possible.",
  },
  {
    q: 'Do I have to share my account?',
    a: 'Not if you don\'t want to. Choose Self-play (Carry) and play alongside our booster team with zero account sharing — or choose Piloted if you\'d rather hand it off entirely.',
  },
  {
    q: 'How fast does an order start?',
    a: 'A professional booster is typically ready within 15–30 minutes of your purchase. You can track live progress from your Dashboard the moment it begins.',
  },
  {
    q: "What if I'm not happy with the result?",
    a: 'We offer a money-back guarantee — unconditional support is provided if anything goes wrong, with a full refund for incorrect or incomplete deliveries.',
  },
]

export default function HomeFAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="container" style={{ paddingBottom: '48px' }}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }} />

      <Reveal>
        <h2 className="h3" style={{ color: '#fff', marginBottom: '18px' }}>Frequently Asked Questions</h2>
      </Reveal>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', overflow: 'hidden', maxWidth: '760px',
      }}>
        {FAQS.map((item, i) => {
          const open = openIndex === i
          return (
            <div key={item.q} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button
                onClick={() => setOpenIndex(open ? -1 : i)}
                aria-expanded={open}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '16px', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#fff',
                  fontFamily: 'var(--font-montserrat)',
                }}
              >
                {item.q}
                <span style={{
                  flexShrink: 0, color: 'var(--gold)', fontSize: '18px', lineHeight: 1,
                  transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                }}>+</span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{
                      padding: '0 22px 20px', margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7',
                    }}>
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
