/** Northstar multi-tenant SaaS model (GHL-inspired). */

export type PlanId = 'presence' | 'pipeline' | 'agency' | 'pilot' | 'setup'
export type TenantKind = 'platform' | 'reseller' | 'business'
export type MembershipRole =
  | 'platform_owner'
  | 'platform_ops'
  | 'reseller_owner'
  | 'reseller_staff'
  | 'business_owner'
  | 'business_member'
export type TenantStatus = 'active' | 'trial' | 'past_due' | 'paused' | 'onboarding'
export type DraftStatus = 'pending' | 'approved' | 'rejected' | 'posted'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'won' | 'lost'

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  priceMonthly: number | null
  priceOneTime: number | null
  audience: 'individual' | 'individual_leads' | 'reseller'
  features: string[]
  maxClientSeats: number // reseller sub-accounts; 1 for individual
  leadGen: boolean
  multiClient: boolean
}

export interface Tenant {
  id: string
  kind: TenantKind
  name: string
  slug: string
  status: TenantStatus
  planId: PlanId
  parentId: string | null // reseller → platform; business → reseller or platform
  brandColor?: string
  createdAt: string
  superGrokOk: boolean
  mrrCents: number
}

export interface User {
  id: string
  email: string
  name: string
  avatarHue: number
}

export interface Membership {
  id: string
  userId: string
  tenantId: string
  role: MembershipRole
}

export interface SocialAccount {
  id: string
  tenantId: string
  platform: 'x' | 'facebook' | 'linkedin' | 'youtube'
  handle: string
  signedIn: boolean
  livePosting: boolean
}

export interface Draft {
  id: string
  tenantId: string
  platform: string
  title: string
  body: string
  status: DraftStatus
  createdAt: string
}

export interface Lead {
  id: string
  tenantId: string
  name: string
  source: string
  status: LeadStatus
  note: string
  createdAt: string
}

export interface ActivityEvent {
  id: string
  tenantId: string
  at: string
  kind: string
  message: string
}

export interface AppState {
  version: number
  users: User[]
  tenants: Tenant[]
  memberships: Membership[]
  accounts: SocialAccount[]
  drafts: Draft[]
  leads: Lead[]
  activity: ActivityEvent[]
  session: {
    userId: string
    activeTenantId: string
  } | null
}

export const PLANS: Plan[] = [
  {
    id: 'pilot',
    name: 'Pilot',
    tagline: '14-day taste of Presence',
    priceMonthly: null,
    priceOneTime: 99,
    audience: 'individual',
    features: ['1–2 networks', 'Draft approvals', 'Slack command', 'Weekly pulse'],
    maxClientSeats: 1,
    leadGen: false,
    multiClient: false,
  },
  {
    id: 'setup',
    name: 'Launch',
    tagline: 'One-time pod stand-up',
    priceMonthly: null,
    priceOneTime: 249,
    audience: 'individual',
    features: ['Voice lock', 'Caps', 'Slack', 'First draft→approve loop'],
    maxClientSeats: 1,
    leadGen: false,
    multiClient: false,
  },
  {
    id: 'presence',
    name: 'Presence',
    tagline: 'Individual — social managed by agents',
    priceMonthly: 99,
    priceOneTime: null,
    audience: 'individual',
    features: [
      'Always-on social presence',
      '1–2 networks',
      'Approval-required posts',
      'Break/fix Slack',
      'Weekly pulse from real logs',
    ],
    maxClientSeats: 1,
    leadGen: false,
    multiClient: false,
  },
  {
    id: 'pipeline',
    name: 'Pipeline',
    tagline: 'Individual — social + lead generation',
    priceMonthly: 249,
    priceOneTime: null,
    audience: 'individual_leads',
    features: [
      'Everything in Presence',
      'Scheduled briefs',
      'Outreach drafts (you approve sends)',
      'Lead inbox',
      'Monthly strategy note',
    ],
    maxClientSeats: 1,
    leadGen: true,
    multiClient: false,
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'Reseller — dashboard for your clients',
    priceMonthly: 499,
    priceOneTime: null,
    audience: 'reseller',
    features: [
      'Reseller control plane',
      'Sub-accounts for each client',
      'Team seats',
      'Client Presence/Pipeline assignment',
      'Cross-client activity',
      'White-label ready (phase 2)',
    ],
    maxClientSeats: 25,
    leadGen: true,
    multiClient: true,
  },
]

export function planOf(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) || PLANS[2]
}
