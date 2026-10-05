import { buildSeed } from './seed'
import type {
  AppState,
  Draft,
  DraftStatus,
  Lead,
  LeadStatus,
  Membership,
  PlanId,
  Tenant,
  TenantStatus,
  User,
} from './types'
import { planOf } from './types'

const KEY = 'northstar-saas-v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return buildSeed()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.version || !parsed.tenants?.length) return buildSeed()
    return parsed
  } catch {
    return buildSeed()
  }
}

function save(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

let state: AppState = load()
const listeners = new Set<() => void>()

function emit() {
  save(state)
  listeners.forEach((l) => l())
}

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getState(): AppState {
  return state
}

export function resetDemo() {
  state = buildSeed()
  emit()
}

export function loginAs(userId: string, tenantId: string) {
  state = { ...state, session: { userId, activeTenantId: tenantId } }
  emit()
}

export function logout() {
  state = { ...state, session: null }
  emit()
}

export function switchTenant(tenantId: string) {
  if (!state.session) return
  state = { ...state, session: { ...state.session, activeTenantId: tenantId } }
  emit()
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function currentUser(): User | null {
  if (!state.session) return null
  return state.users.find((u) => u.id === state.session!.userId) || null
}

export function currentTenant(): Tenant | null {
  if (!state.session) return null
  return state.tenants.find((t) => t.id === state.session!.activeTenantId) || null
}

export function membershipsForUser(userId: string): Membership[] {
  return state.memberships.filter((m) => m.userId === userId)
}

export function roleInTenant(userId: string, tenantId: string) {
  return state.memberships.find((m) => m.userId === userId && m.tenantId === tenantId)?.role
}

export function childrenOf(tenantId: string): Tenant[] {
  return state.tenants.filter((t) => t.parentId === tenantId)
}

export function businessesUnder(resellerId: string): Tenant[] {
  return state.tenants.filter((t) => t.kind === 'business' && t.parentId === resellerId)
}

export function allBusinesses(): Tenant[] {
  return state.tenants.filter((t) => t.kind === 'business')
}

export function allResellers(): Tenant[] {
  return state.tenants.filter((t) => t.kind === 'reseller')
}

export function draftsFor(tenantId: string): Draft[] {
  return state.drafts.filter((d) => d.tenantId === tenantId)
}

export function leadsFor(tenantId: string): Lead[] {
  return state.leads.filter((l) => l.tenantId === tenantId)
}

export function accountsFor(tenantId: string) {
  return state.accounts.filter((a) => a.tenantId === tenantId)
}

export function activityFor(tenantId: string, includeChildren = false) {
  if (!includeChildren) return state.activity.filter((e) => e.tenantId === tenantId)
  const ids = new Set([tenantId, ...childrenOf(tenantId).map((t) => t.id)])
  // platform sees everything
  const t = state.tenants.find((x) => x.id === tenantId)
  if (t?.kind === 'platform') return [...state.activity].sort((a, b) => b.at.localeCompare(a.at))
  return state.activity.filter((e) => ids.has(e.tenantId)).sort((a, b) => b.at.localeCompare(a.at))
}

export function usersInTenant(tenantId: string): { user: User; role: string }[] {
  return state.memberships
    .filter((m) => m.tenantId === tenantId)
    .map((m) => ({
      user: state.users.find((u) => u.id === m.userId)!,
      role: m.role,
    }))
    .filter((x) => x.user)
}

export function platformMrrCents(): number {
  return state.tenants
    .filter((t) => t.kind !== 'platform' && (t.status === 'active' || t.status === 'trial' || t.status === 'onboarding'))
    .reduce((s, t) => s + t.mrrCents, 0)
}

export function setDraftStatus(id: string, status: DraftStatus) {
  state = {
    ...state,
    drafts: state.drafts.map((d) => (d.id === id ? { ...d, status } : d)),
    activity: [
      {
        id: uid('e'),
        tenantId: state.drafts.find((d) => d.id === id)?.tenantId || '',
        at: new Date().toISOString(),
        kind: 'draft',
        message: `Draft ${status}`,
      },
      ...state.activity,
    ],
  }
  emit()
}

export function setLeadStatus(id: string, status: LeadStatus) {
  state = {
    ...state,
    leads: state.leads.map((l) => (l.id === id ? { ...l, status } : l)),
  }
  emit()
}

export function addBusinessClient(opts: {
  parentId: string
  name: string
  slug: string
  planId: PlanId
  ownerName: string
  ownerEmail: string
}) {
  const tenantId = uid('t')
  const userId = uid('u')
  const plan = planOf(opts.planId)
  const tenant: Tenant = {
    id: tenantId,
    kind: 'business',
    name: opts.name,
    slug: opts.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 31),
    status: 'onboarding',
    planId: opts.planId,
    parentId: opts.parentId,
    createdAt: new Date().toISOString(),
    superGrokOk: false,
    mrrCents: (plan.priceMonthly || 0) * 100,
  }
  const user: User = {
    id: userId,
    name: opts.ownerName,
    email: opts.ownerEmail,
    avatarHue: Math.floor(Math.random() * 360),
  }
  state = {
    ...state,
    tenants: [...state.tenants, tenant],
    users: [...state.users, user],
    memberships: [
      ...state.memberships,
      { id: uid('m'), userId, tenantId, role: 'business_owner' },
    ],
    activity: [
      {
        id: uid('e'),
        tenantId: opts.parentId,
        at: new Date().toISOString(),
        kind: 'client',
        message: `Created client ${opts.name} (${plan.name})`,
      },
      ...state.activity,
    ],
  }
  emit()
  return tenantId
}

export function addReseller(opts: { name: string; slug: string; ownerName: string; ownerEmail: string }) {
  const tenantId = uid('t')
  const userId = uid('u')
  const tenant: Tenant = {
    id: tenantId,
    kind: 'reseller',
    name: opts.name,
    slug: opts.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 31),
    status: 'active',
    planId: 'agency',
    parentId: 't-platform',
    createdAt: new Date().toISOString(),
    superGrokOk: true,
    mrrCents: 49900,
    brandColor: '#F5B700',
  }
  const user: User = {
    id: userId,
    name: opts.ownerName,
    email: opts.ownerEmail,
    avatarHue: Math.floor(Math.random() * 360),
  }
  state = {
    ...state,
    tenants: [...state.tenants, tenant],
    users: [...state.users, user],
    memberships: [
      ...state.memberships,
      { id: uid('m'), userId, tenantId, role: 'reseller_owner' },
    ],
    activity: [
      {
        id: uid('e'),
        tenantId: 't-platform',
        at: new Date().toISOString(),
        kind: 'reseller',
        message: `Reseller onboarded: ${opts.name}`,
      },
      ...state.activity,
    ],
  }
  emit()
  return tenantId
}

export function setTenantStatus(id: string, status: TenantStatus) {
  state = {
    ...state,
    tenants: state.tenants.map((t) => (t.id === id ? { ...t, status } : t)),
  }
  emit()
}

export function toggleSuperGrok(id: string) {
  state = {
    ...state,
    tenants: state.tenants.map((t) => (t.id === id ? { ...t, superGrokOk: !t.superGrokOk } : t)),
  }
  emit()
}

export function toggleAccountSignedIn(id: string) {
  state = {
    ...state,
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, signedIn: !a.signedIn } : a)),
  }
  emit()
}

export function toggleLivePosting(id: string) {
  state = {
    ...state,
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, livePosting: !a.livePosting } : a)),
  }
  emit()
}
