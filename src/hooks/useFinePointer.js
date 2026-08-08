'use client'

import { useSyncExternalStore } from 'react'

const FINE_POINTER_QUERY = '(min-width: 769px) and (hover: hover) and (pointer: fine)'

function subscribe(onChange) {
  const mediaQuery = window.matchMedia(FINE_POINTER_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function getSnapshot() {
  return window.matchMedia(FINE_POINTER_QUERY).matches
}

function getServerSnapshot() {
  return false
}

export default function useFinePointer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
