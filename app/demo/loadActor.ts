// Client-side helpers to install/clear a demo actor in localStorage.
// Used by /demo (to install) and DemoBanner (to clear).

import type { DemoActor } from '../data/demoActors'
import { svgToDataUrl } from '../data/demoActors'

const KEYS = {
  HOME_COUNTRY: '1503:homeCountry',
  REG_ENTITY: '1503:registrationEntity',
  REG_KIND: '1503:registrationKind',
  REG_SECTOR: '1503:registrationSector',
  REG_ROLE: '1503:registrationRole',
  REG_DATA: '1503:registrationData',
  COMPANY_LOGO: '1503:companyLogo',
  AVATAR: '1503:avatar',
  DISPLAY_NAME: '1503:displayName',
  LEGAL_DOCS: '1503:legalDocs',
  DEMO_MODE: '1503:demoMode',
  DEMO_ACTOR_ID: '1503:demoActorId',
}

/** Per-doc blob keys are 1503:legalDoc:<idx>. We don't write blobs in
    demo mode — the metadata is enough to make the UI show "uploaded". */

/** Install the actor in localStorage and return the workspace URL the
    caller should redirect to. Must be called from a client component. */
export function installDemoActor(actor: DemoActor): string {
  if (typeof window === 'undefined') {
    throw new Error('installDemoActor must run in the browser')
  }
  // Wipe any prior 1503:* keys (including doc blobs from previous
  // sessions) so we start clean.
  clearDemoStorage()

  const ls = window.localStorage
  ls.setItem(KEYS.HOME_COUNTRY, actor.homeCountry)
  ls.setItem(KEYS.REG_ENTITY, actor.entityCode)
  ls.setItem(KEYS.REG_KIND, actor.kind)
  ls.setItem(KEYS.REG_SECTOR, actor.sectorId)
  ls.setItem(KEYS.REG_ROLE, actor.roleId)
  ls.setItem(KEYS.REG_DATA, JSON.stringify(actor.data))
  ls.setItem(KEYS.COMPANY_LOGO, svgToDataUrl(actor.logoSvg))
  if (actor.avatarSvg) {
    ls.setItem(KEYS.AVATAR, svgToDataUrl(actor.avatarSvg))
  }
  ls.setItem(KEYS.DISPLAY_NAME, actor.displayName)

  // Doc metadata only — the UI will show them as "uploaded" but clicking
  // won't open anything because no blob exists. Acceptable for demo nav.
  const docMetas = actor.docs.map((d) => ({
    idx: d.idx,
    label: d.label,
    filename: d.filename,
    mime: 'application/pdf',
    size: d.size,
    uploadedAt: Date.now() - 86_400_000 * (Math.floor(Math.random() * 30) + 1),
  }))
  ls.setItem(KEYS.LEGAL_DOCS, JSON.stringify(docMetas))

  ls.setItem(KEYS.DEMO_MODE, 'true')
  ls.setItem(KEYS.DEMO_ACTOR_ID, actor.id)

  return `/sector/${actor.sectorId}`
}

/** Wipe all 1503:* keys from localStorage. Called when entering a
    new demo actor (so we start clean) and when exiting demo mode. */
export function clearDemoStorage(): void {
  if (typeof window === 'undefined') return
  const ls = window.localStorage
  const toRemove: string[] = []
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i)
    if (k && k.startsWith('1503:')) toRemove.push(k)
  }
  toRemove.forEach((k) => ls.removeItem(k))
}

/** Read the current demo state. Used by DemoBanner. */
export function readDemoState(): { active: boolean; actorId: string | null } {
  if (typeof window === 'undefined') return { active: false, actorId: null }
  const ls = window.localStorage
  return {
    active: ls.getItem(KEYS.DEMO_MODE) === 'true',
    actorId: ls.getItem(KEYS.DEMO_ACTOR_ID),
  }
}
