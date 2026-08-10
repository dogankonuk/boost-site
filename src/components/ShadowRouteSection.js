'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { useCurrency } from '@/context/CurrencyContext'
import { useActiveCampaigns } from '@/lib/useActiveCampaigns'
import { applyCampaignDiscount } from '@/lib/pricing'
import CampaignBadge from './CampaignBadge'

const GOALS = [
  { id: 'level', label: 'Level up', hint: 'Levels, XP and progression', words: ['level', 'leveling', 'power', 'xp', 'progress'] },
  { id: 'currency', label: 'Earn currency', hint: 'Coins, gold and farming', words: ['currency', 'coin', 'gold', 'silver', 'farm', 'farming'] },
  { id: 'rank', label: 'Climb ranks', hint: 'Ranked and competitive play', words: ['rank', 'ranking', 'elo', 'arena', 'pvp'] },
  { id: 'activity', label: 'Complete an activity', hint: 'Raids, quests and challenges', words: ['raid', 'dungeon', 'quest', 'boss', 'trial', 'campaign', 'achievement', 'activity'] },
  { id: 'unlock', label: 'Unlock gear', hint: 'Items, weapons and rewards', words: ['item', 'weapon', 'gear', 'loot', 'unlock', 'reward', 'material'] },
  { id: 'all', label: 'Explore all services', hint: 'Show everything available', words: [] },
]

function serviceText(service) {
  return `${service.name} ${service.serviceCategory || ''}`.toLocaleLowerCase('en-US')
}

function RouteLine({ activeStep, reduceMotion }) {
  const progress = activeStep === 1 ? 28 : activeStep === 2 ? 62 : 100

  return (
    <div className="shadow-route-lines" aria-hidden="true">
      <svg className="shadow-route-line shadow-route-line-top" viewBox="0 0 1000 96" preserveAspectRatio="none">
        <defs>
          <marker id="shadow-arrow-top" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(245,197,24,.8)" />
          </marker>
        </defs>
        <path className="shadow-route-track" d="M20,72 C170,8 285,88 420,42 S690,10 980,60" />
        <path
          className={`shadow-route-signal ${reduceMotion ? 'shadow-route-signal-static' : ''}`}
          pathLength="100"
          strokeDasharray={`${progress} 100`}
          d="M20,72 C170,8 285,88 420,42 S690,10 980,60"
          markerEnd="url(#shadow-arrow-top)"
        />
      </svg>
      <svg className="shadow-route-line shadow-route-line-bottom" viewBox="0 0 1000 96" preserveAspectRatio="none">
        <defs>
          <marker id="shadow-arrow-bottom" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(147,51,234,.8)" />
          </marker>
        </defs>
        <path className="shadow-route-track shadow-route-track-purple" d="M20,28 C190,94 310,5 470,54 S750,90 980,32" />
        <path
          className="shadow-route-purple-signal"
          pathLength="100"
          strokeDasharray={`${progress} 100`}
          d="M20,28 C190,94 310,5 470,54 S750,90 980,32"
          markerEnd="url(#shadow-arrow-bottom)"
        />
      </svg>
    </div>
  )
}

export default function ShadowRouteSection({ games = [] }) {
  const { format } = useCurrency()
  const reduceMotion = useReducedMotion()
  const campaigns = useActiveCampaigns()
  const [gameId, setGameId] = useState('')
  const [goalId, setGoalId] = useState('')
  const [serviceId, setServiceId] = useState('')

  const selectedGame = games.find(game => String(game.id) === gameId)
  const selectedGoal = GOALS.find(goal => goal.id === goalId)
  const matchingServices = useMemo(() => {
    if (!selectedGame) return []
    if (!selectedGoal || selectedGoal.id === 'all') return selectedGame.services
    return selectedGame.services.filter(service => {
      if (Array.isArray(service.discoveryGoals) && service.discoveryGoals.length > 0) {
        return service.discoveryGoals.includes(selectedGoal.id)
      }
      const text = serviceText(service)
      return selectedGoal.words.some(word => text.includes(word))
    })
  }, [selectedGame, selectedGoal])
  const visibleServices = matchingServices.length > 0
    ? matchingServices
    : selectedGame?.services || []
  const isShowingFallback = Boolean(
    selectedGame &&
    selectedGoal &&
    selectedGoal.id !== 'all' &&
    matchingServices.length === 0
  )
  const selectedService = visibleServices.find(service => String(service.id) === serviceId)
  const serviceDiscount = selectedService
    ? applyCampaignDiscount(selectedService.basePrice, selectedGame?.id, campaigns)
    : null
  const activeStep = selectedService ? 3 : goalId ? 2 : 1

  function chooseGame(value) {
    setGameId(value)
    setGoalId('')
    setServiceId('')
  }

  function chooseGoal(value) {
    setGoalId(value)
    setServiceId('')
  }

  useEffect(() => {
    function selectGameFromSlider(event) {
      const nextGameId = String(event.detail?.gameId || '')
      if (!games.some(game => String(game.id) === nextGameId)) return
      chooseGame(nextGameId)
      document.getElementById('shadow-route')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }

    window.addEventListener('shadow-route:select-game', selectGameFromSlider)
    return () => window.removeEventListener('shadow-route:select-game', selectGameFromSlider)
  }, [games, reduceMotion])

  if (games.length === 0) return null

  return (
    <section className="shadow-route-section" id="shadow-route" aria-labelledby="shadow-route-title">
      <div className="container">
        <div className="shadow-route-heading">
          <div>
            <span className="shadow-route-kicker">SHADOW ROUTE / 01</span>
            <h2 id="shadow-route-title">Build your route through the grind</h2>
          </div>
          <p>Start with your goal. We’ll lead you to the right service, price and next step.</p>
        </div>

        <div className="shadow-route-shell">
          <RouteLine activeStep={activeStep} reduceMotion={reduceMotion} />

          <div className="shadow-route-grid">
            <article className={`shadow-route-step ${gameId ? 'is-complete' : 'is-active'}`}>
              <div className="shadow-route-step-head">
                <span>01</span>
                <div><strong>Choose your game</strong><small>Where are we heading?</small></div>
              </div>
              <label className="shadow-route-label" htmlFor="shadow-route-game">Game</label>
              <select id="shadow-route-game" value={gameId} onChange={event => chooseGame(event.target.value)}>
                <option value="">Select a game</option>
                {games.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}
              </select>
            </article>

            <article className={`shadow-route-step ${goalId ? 'is-complete' : gameId ? 'is-active' : ''}`}>
              <div className="shadow-route-step-head">
                <span>02</span>
                <div><strong>Choose your goal</strong><small>Tell us what success looks like.</small></div>
              </div>
              <div className="shadow-route-goals" aria-label="Choose your goal">
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    disabled={!gameId}
                    className={goalId === goal.id ? 'is-selected' : ''}
                    onClick={() => chooseGoal(goal.id)}
                    title={goal.hint}
                  >
                    <span>{goal.label}</span>
                    <small>{goal.hint}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className={`shadow-route-step shadow-route-result ${selectedService ? 'is-complete' : goalId ? 'is-active' : ''}`}>
              <div className="shadow-route-step-head">
                <span>03</span>
                <div><strong>Select your service</strong><small>Your route, ready to configure.</small></div>
              </div>
              <label className="shadow-route-label" htmlFor="shadow-route-service">Service</label>
              <select
                id="shadow-route-service"
                value={serviceId}
                disabled={!goalId}
                onChange={event => setServiceId(event.target.value)}
              >
                <option value="">{goalId ? 'Select a service' : 'Choose a goal first'}</option>
                {visibleServices.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              {isShowingFallback && (
                <p className="shadow-route-fallback" role="status">
                  No exact match for “{selectedGoal.label}” in {selectedGame.name}. Showing all {selectedGame.name} services instead.
                </p>
              )}

              <div className="shadow-route-summary" aria-live="polite">
                <div>
                  <small>YOUR ROUTE</small>
                  <strong>{selectedService ? selectedService.name : 'Waiting for your destination'}</strong>
                  <span>{selectedGame?.name || 'Game'} · {selectedGoal?.label || 'Goal'}</span>
                </div>
                {selectedService && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {serviceDiscount?.campaign && (
                      <>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                          {format(serviceDiscount.originalPrice)}
                        </span>
                        <CampaignBadge pct={serviceDiscount.campaign.discountPct} />
                      </>
                    )}
                    <b>From {format(serviceDiscount ? serviceDiscount.price : selectedService.basePrice)}</b>
                  </div>
                )}
              </div>

              {selectedService ? (
                <Link href={`/order/${selectedService.id}`} className="shadow-route-cta">
                  Configure my route <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <span className="shadow-route-cta is-disabled">Complete the route to continue</span>
              )}
              <p className="shadow-route-safety">
                <span aria-hidden="true">◇</span>
                Delivery method and account-access requirements are shown before checkout.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
