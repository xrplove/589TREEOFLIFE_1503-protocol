'use client'

import { useEffect } from 'react'

/** Side-effect-only client island: when the user lands on /register/[code],
    persist the country code to localStorage so the post-login workspace can
    derive the user's display language via langForCountry(). */
export default function RegisterPersist({ code }: { code: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('1503:homeCountry', code.toUpperCase())
    } catch {}
  }, [code])

  return null
}
