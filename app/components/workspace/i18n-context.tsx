'use client'

import { createContext, useContext } from 'react'
import { getWorkspaceStrings, type Lang, type WorkspaceStrings } from '../../data/i18n'

/* ────────────────────────────── I18N CONTEXT ──────────────────────────────
   The user's display language is derived once on mount from localStorage
   (`1503:homeCountry`, set on /register/[code]) and propagated to every
   sub-component via context. Falls back to Spanish if no country is stored.
   Provides BOTH the translated strings (t) AND the raw lang code (needed by
   helpers like getLabel() to read LocalizedLabel objects from actorGroups). */

export type I18nContextValue = { t: WorkspaceStrings; lang: Lang }

export const I18nCtx = createContext<I18nContextValue>({
  t: getWorkspaceStrings('es'),
  lang: 'es',
})

export function useT(): WorkspaceStrings {
  return useContext(I18nCtx).t
}

export function useLang(): Lang {
  return useContext(I18nCtx).lang
}
