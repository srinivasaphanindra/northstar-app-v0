import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  Settings,
  LogOut,
  Network,
  Wallet,
  Activity,
  Target,
  Shield,
} from 'lucide-react'
import { useAppState } from './hooks'
import {
  currentTenant,
  currentUser,
  logout,
  membershipsForUser,
  roleInTenant,
  switchTenant,
  getState,
} from './store'
import type { MembershipRole, TenantKind } from './types'
import { planOf } from './types'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'ok',
    trial: 'info',
    onboarding: 'warn',
    past_due: 'bad',
    paused: 'muted',
  }
  return map[status] || ''
}

function navFor(kind: TenantKind, role: MembershipRole | null) {
  if (kind === 'platform') {
    return [
      { to: '/app/platform', label: 'Platform home', icon: LayoutDashboard },
      { to: '/app/platform/resellers', label: 'Resellers', icon: Network },
      { to: '/app/platform/businesses', label: 'All businesses', icon: Building2 },
      { to: '/app/platform/users', label: 'Users', icon: Users },
      { to: '/app/platform/plans', label: 'Plans', icon: Wallet },
      { to: '/app/platform/activity', label: 'Activity', icon: Activity },
    ]
  }
  if (kind === 'reseller') {
    return [
      { to: '/app/reseller', label: 'Agency home', icon: LayoutDashboard },
      { to: '/app/reseller/clients', label: 'Clients', icon: Building2 },
      { to: '/app/reseller/team', label: 'Team', icon: Users },
      { to: '/app/reseller/billing', label: 'Billing', icon: Wallet },
      { to: '/app/reseller/activity', label: 'Activity', icon: Activity },
      { to: '/app/reseller/settings', label: 'Settings', icon: Settings },
    ]
  }
  // business
  const base = [
    { to: '/app/business', label: 'Home', icon: LayoutDashboard },
    { to: '/app/business/onboarding', label: 'Onboarding', icon: Shield },
    { to: '/app/business/accounts', label: 'Social accounts', icon: Megaphone },
    { to: '/app/business/drafts', label: 'Drafts', icon: FileText },
    { to: '/app/business/team', label: 'Team', icon: Users },
  ]
  if (role === 'business_owner' || role === 'business_member' || role === 'platform_ops') {
    // leads if pipeline/agency plan
  }
  return [
    ...base.slice(0, 4),
    { to: '/app/business/leads', label: 'Leads', icon: Target },
    ...base.slice(4),
    { to: '/app/business/settings', label: 'Settings', icon: Settings },
  ]
}

export function AppLayout() {
  const state = useAppState()
  const user = currentUser()
  const tenant = currentTenant()
  const navigate = useNavigate()
  if (!user || !tenant || !state.session) {
    return <Navigate to="/login" replace />
  }
  const role = roleInTenant(user.id, tenant.id)
  const items = navFor(tenant.kind, role || null)
  const memberships = membershipsForUser(user.id)
  const plan = planOf(tenant.planId)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="mark" />
          <div>
            <strong>Northstar</strong>
            <span>
              {tenant.kind === 'platform' ? 'Platform' : tenant.kind === 'reseller' ? 'Reseller' : 'Business'}
            </span>
          </div>
        </div>

        <div className="nav-label">Workspace</div>
        <div className="card" style={{ padding: 10, margin: '0 4px 8px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tenant.name}</div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className={`badge ${statusBadge(tenant.status)}`}>{tenant.status}</span>
            {tenant.kind !== 'platform' && <span className="badge gold">{plan.name}</span>}
          </div>
        </div>

        <div className="nav-label">Navigate</div>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 3}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-foot">
          <div className="nav-label">Switch workspace</div>
          <select
            value={tenant.id}
            onChange={(e) => {
              switchTenant(e.target.value)
              const t = getState().tenants.find((x) => x.id === e.target.value)
              if (!t) return
              if (t.kind === 'platform') navigate('/app/platform')
              else if (t.kind === 'reseller') navigate('/app/reseller')
              else navigate('/app/business')
            }}
          >
            {memberships.map((m) => {
              const t = state.tenants.find((x) => x.id === m.tenantId)
              if (!t) return null
              return (
                <option key={m.id} value={t.id}>
                  {t.name} ({t.kind})
                </option>
              )
            })}
          </select>
          <button
            className="btn ghost sm"
            style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="row">
            <span className="badge">{role?.replaceAll('_', ' ')}</span>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              Signed in as <strong style={{ color: '#fff' }}>{user.name}</strong>
            </span>
          </div>
          <div className="row">
            <a className="btn ghost sm" href="https://srinivasaphanindra.github.io/northstar-agents/" target="_blank" rel="noreferrer">
              Marketing site
            </a>
            <div
              className="avatar"
              style={{ background: `hsl(${user.avatarHue} 70% 55%)` }}
              title={user.email}
            >
              {user.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </div>
          </div>
        </header>
        <div className="content">
          <div className="banner">
            <strong>Demo control plane</strong> — data lives in this browser (localStorage). Architecture targets
            real multi-tenant SaaS (platform → reseller → business). Not connected to live pods yet.
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="card">
      <h3 className="muted" style={{ fontWeight: 600 }}>
        {label}
      </h3>
      <div className="metric">{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  )
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h1 className="h1">{title}</h1>
      {sub ? <p className="sub">{sub}</p> : null}
    </div>
  )
}
