import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageTitle, Stat } from './components'
import { useAppState } from './hooks'
import {
  activityFor,
  addBusinessClient,
  addReseller,
  allBusinesses,
  allResellers,
  businessesUnder,
  currentTenant,
  loginAs,
  platformMrrCents,
  resetDemo,
  setDraftStatus,
  setLeadStatus,
  setTenantStatus,
  toggleAccountSignedIn,
  toggleLivePosting,
  toggleSuperGrok,
  usersInTenant,
  draftsFor,
  leadsFor,
  accountsFor,
} from './store'
import { PLANS, planOf, type PlanId } from './types'

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function Status({ s }: { s: string }) {
  const cls = s === 'active' ? 'ok' : s === 'trial' ? 'info' : s === 'onboarding' ? 'warn' : s === 'past_due' ? 'bad' : ''
  return <span className={`badge ${cls}`}>{s}</span>
}

/* ---------------- Login ---------------- */
export function LoginPage() {
  const navigate = useNavigate()
  const state = useAppState()

  const personas = useMemo(
    () => [
      {
        title: 'Platform owner',
        name: 'Phanindra',
        blurb: 'Super-admin: resellers, all businesses, plans, platform MRR.',
        userId: 'u-phanindra',
        tenantId: 't-platform',
        path: '/app/platform',
        tag: 'You',
      },
      {
        title: 'Reseller owner',
        name: 'Riya · Bright Agency',
        blurb: 'Agency plan: onboard clients, assign Presence/Pipeline, team seats.',
        userId: 'u-riya',
        tenantId: 't-bright',
        path: '/app/reseller',
        tag: 'Reseller',
      },
      {
        title: 'Business · Pipeline',
        name: 'Alex · Acme Studio',
        blurb: 'Individual + lead gen: drafts, leads, social accounts.',
        userId: 'u-alex',
        tenantId: 't-acme',
        path: '/app/business',
        tag: 'Pipeline $249',
      },
      {
        title: 'Business · Presence',
        name: 'Mike Torres',
        blurb: 'Individual social only — direct Northstar customer.',
        userId: 'u-mike',
        tenantId: 't-mike',
        path: '/app/business',
        tag: 'Presence $99',
      },
      {
        title: 'Business · onboarding',
        name: 'Priya · Leaf Studio',
        blurb: 'Client under Bright Agency still finishing setup.',
        userId: 'u-priya',
        tenantId: 't-leaf',
        path: '/app/business',
        tag: 'Onboarding',
      },
      {
        title: 'Reseller staff',
        name: 'Sam · Bright',
        blurb: 'Staff seat on reseller tenant (limited admin).',
        userId: 'u-sam',
        tenantId: 't-bright',
        path: '/app/reseller',
        tag: 'Staff',
      },
    ],
    [],
  )

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="row" style={{ marginBottom: 8 }}>
              <div className="mark" />
              <strong>Northstar App</strong>
              <span className="badge gold">Multi-tenant demo</span>
            </div>
            <h1>Choose who you are</h1>
            <p className="muted">
              Paid-user control plane. Public visitors stay on the marketing site. Pick a persona to enter the matching
              dashboard (GHL-style: platform → reseller → business).
            </p>
          </div>
          <button className="btn ghost sm" onClick={() => resetDemo()}>
            Reset demo data
          </button>
        </div>
        <div className="persona-grid">
          {personas.map((p) => (
            <button
              key={p.title}
              className="persona"
              type="button"
              onClick={() => {
                loginAs(p.userId, p.tenantId)
                navigate(p.path)
              }}
            >
              <strong>{p.title}</strong>
              <span>{p.name}</span>
              <span>{p.blurb}</span>
              <em>{p.tag}</em>
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 18, fontSize: '0.82rem' }}>
          Seed tenants: {state.tenants.length} · users: {state.users.length} · This is a working UI system with
          persistent local state. Backend wiring is the next phase (see product docs).
        </p>
        <p style={{ marginTop: 10 }}>
          <a href="https://srinivasaphanindra.github.io/northstar-agents/">← Marketing site</a>
        </p>
      </div>
    </div>
  )
}

/* ---------------- Platform ---------------- */
export function PlatformHome() {
  const state = useAppState()
  const resellers = allResellers()
  const businesses = allBusinesses()
  const mrr = platformMrrCents()
  const activity = activityFor('t-platform', true).slice(0, 8)

  return (
    <div>
      <PageTitle title="Platform control plane" sub="Super-admin view across resellers and direct businesses." />
      <div className="grid stats">
        <Stat label="Platform MRR" value={money(mrr)} hint="Sum of active tenant plan prices (demo)" />
        <Stat label="Resellers" value={resellers.length} />
        <Stat label="Businesses" value={businesses.length} />
        <Stat label="Users" value={state.users.length} />
      </div>
      <div className="grid two" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Resellers</h3>
          <div className="table-wrap" style={{ marginTop: 12, border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Clients</th>
                  <th>Status</th>
                  <th>MRR</th>
                </tr>
              </thead>
              <tbody>
                {resellers.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{businessesUnder(r.id).length}</td>
                    <td>
                      <Status s={r.status} />
                    </td>
                    <td>{money(r.mrrCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Live activity</h3>
          <div className="stack" style={{ marginTop: 8 }}>
            {activity.map((e) => (
              <div key={e.id} className="list-item">
                <div>
                  <strong style={{ color: '#fff' }}>{e.message}</strong>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    {e.kind} · {new Date(e.at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlatformResellers() {
  const resellers = allResellers()
  const [form, setForm] = useState({ name: '', slug: '', ownerName: '', ownerEmail: '' })

  return (
    <div>
      <PageTitle title="Resellers" sub="Agency-tier tenants who manage their own client sub-accounts." />
      <div className="grid two">
        <div className="card">
          <h3>Directory</h3>
          <div className="table-wrap" style={{ marginTop: 12, border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Reseller</th>
                  <th>Slug</th>
                  <th>Clients</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resellers.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="mono">{r.slug}</td>
                    <td>{businessesUnder(r.id).length}</td>
                    <td>
                      <Status s={r.status} />
                    </td>
                    <td>
                      <button className="btn ghost sm" onClick={() => setTenantStatus(r.id, r.status === 'paused' ? 'active' : 'paused')}>
                        {r.status === 'paused' ? 'Unpause' : 'Pause'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Onboard reseller</h3>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Creates Agency plan tenant + owner user (demo write).
          </p>
          <div className="stack" style={{ marginTop: 12 }}>
            <div>
              <label>Agency name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bright Agency" />
            </div>
            <div>
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="bright" />
            </div>
            <div>
              <label>Owner name</label>
              <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div>
              <label>Owner email</label>
              <input value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!form.name || !form.slug || !form.ownerEmail) return
                addReseller(form)
                setForm({ name: '', slug: '', ownerName: '', ownerEmail: '' })
              }}
            >
              Create reseller
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlatformBusinesses() {
  const businesses = allBusinesses()
  const state = useAppState()
  return (
    <div>
      <PageTitle title="All businesses" sub="Direct customers and reseller sub-accounts." />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Plan</th>
              <th>Parent</th>
              <th>Status</th>
              <th>SuperGrok</th>
              <th>MRR</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => {
              const parent = state.tenants.find((t) => t.id === b.parentId)
              return (
                <tr key={b.id}>
                  <td>
                    {b.name}
                    <div className="muted mono" style={{ fontSize: '0.75rem' }}>
                      {b.slug}
                    </div>
                  </td>
                  <td>
                    <span className="badge gold">{planOf(b.planId).name}</span>
                  </td>
                  <td>{parent?.kind === 'reseller' ? parent.name : 'Northstar direct'}</td>
                  <td>
                    <Status s={b.status} />
                  </td>
                  <td>
                    <button className="btn ghost sm" onClick={() => toggleSuperGrok(b.id)}>
                      {b.superGrokOk ? 'OK' : 'Missing'}
                    </button>
                  </td>
                  <td>{money(b.mrrCents)}</td>
                  <td>
                    <select
                      value={b.status}
                      onChange={(e) => setTenantStatus(b.id, e.target.value as any)}
                      style={{ marginBottom: 0 }}
                    >
                      <option value="onboarding">onboarding</option>
                      <option value="trial">trial</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="past_due">past_due</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PlatformUsers() {
  const state = useAppState()
  return (
    <div>
      <PageTitle title="Users" sub="Global directory. Roles are membership-scoped per tenant." />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Memberships</th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => {
              const ms = state.memberships.filter((m) => m.userId === u.id)
              return (
                <tr key={u.id}>
                  <td>
                    <div className="row">
                      <div className="avatar" style={{ background: `hsl(${u.avatarHue} 70% 55%)` }}>
                        {u.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <div className="row">
                      {ms.map((m) => {
                        const t = state.tenants.find((x) => x.id === m.tenantId)
                        return (
                          <span key={m.id} className="badge">
                            {t?.name}: {m.role.replaceAll('_', ' ')}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PlatformPlans() {
  return (
    <div>
      <PageTitle
        title="Plans"
        sub="Maps your three visitor intents: individual · individual+leads · reseller. Prices match Product A ladder."
      />
      <div className="grid three">
        {PLANS.filter((p) => ['presence', 'pipeline', 'agency'].includes(p.id)).map((p) => (
          <div className="card" key={p.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{p.name}</h3>
              <span className="badge gold">
                {p.priceMonthly ? `$${p.priceMonthly}/mo` : p.priceOneTime ? `$${p.priceOneTime}` : ''}
              </span>
            </div>
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              {p.tagline}
            </p>
            <ul className="muted" style={{ paddingLeft: 18, fontSize: '0.88rem' }}>
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="badge">{p.audience.replaceAll('_', ' ')}</span>
              <span className="badge">max clients {p.maxClientSeats}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Also available</h3>
        <p className="muted">
          Pilot $99 / 14d · Launch setup $249 — one-time SKUs from Product A. Reseller white-label domain = phase 2.
        </p>
      </div>
    </div>
  )
}

export function PlatformActivity() {
  const events = activityFor('t-platform', true)
  return (
    <div>
      <PageTitle title="Platform activity" sub="Cross-tenant feed (demo events)." />
      <div className="card">
        {events.map((e) => (
          <div key={e.id} className="list-item">
            <div>
              <strong style={{ color: '#fff' }}>{e.message}</strong>
              <div className="muted" style={{ fontSize: '0.78rem' }}>
                tenant {e.tenantId} · {e.kind} · {new Date(e.at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Reseller ---------------- */
export function ResellerHome() {
  const tenant = currentTenant()!
  const clients = businessesUnder(tenant.id)
  const mrr = clients.reduce((s, c) => s + c.mrrCents, 0)
  const activity = activityFor(tenant.id, true).slice(0, 8)
  return (
    <div>
      <PageTitle title={`${tenant.name} · Agency`} sub="Reseller dashboard — manage client sub-accounts like GHL." />
      <div className="grid stats">
        <Stat label="Client sub-accounts" value={clients.length} hint={`Cap ${planOf(tenant.planId).maxClientSeats}`} />
        <Stat label="Client MRR" value={money(mrr)} hint="What your clients pay (demo)" />
        <Stat label="Your plan" value={planOf(tenant.planId).name} hint={money(tenant.mrrCents) + '/mo to Northstar'} />
        <Stat
          label="Needs attention"
          value={clients.filter((c) => c.status === 'onboarding' || !c.superGrokOk).length}
          hint="Onboarding or SuperGrok missing"
        />
      </div>
      <div className="grid two" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Clients</h3>
          <div className="table-wrap" style={{ marginTop: 10, border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <span className="badge gold">{planOf(c.planId).name}</span>
                    </td>
                    <td>
                      <Status s={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Activity</h3>
          {activity.map((e) => (
            <div key={e.id} className="list-item">
              <div>
                <strong style={{ color: '#fff' }}>{e.message}</strong>
                <div className="muted" style={{ fontSize: '0.78rem' }}>
                  {new Date(e.at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResellerClients() {
  const tenant = currentTenant()!
  const clients = businessesUnder(tenant.id)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    planId: 'presence' as PlanId,
    ownerName: '',
    ownerEmail: '',
  })
  return (
    <div>
      <PageTitle title="Client sub-accounts" sub="Each client is an isolated business tenant under your agency." />
      <div className="grid two">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan</th>
                <th>SuperGrok</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    <div className="muted mono" style={{ fontSize: '0.75rem' }}>
                      {c.slug}
                    </div>
                  </td>
                  <td>{planOf(c.planId).name}</td>
                  <td>{c.superGrokOk ? <span className="badge ok">OK</span> : <span className="badge warn">Need</span>}</td>
                  <td>
                    <Status s={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Add client</h3>
          <div className="stack">
            <div>
              <label>Business name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label>Plan</label>
              <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value as PlanId })}>
                <option value="presence">Presence — individual social ($99)</option>
                <option value="pipeline">Pipeline — social + lead gen ($249)</option>
                <option value="pilot">Pilot 14d ($99)</option>
              </select>
            </div>
            <div>
              <label>Owner name</label>
              <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div>
              <label>Owner email</label>
              <input value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
            <button
              className="btn"
              onClick={() => {
                if (!form.name || !form.slug) return
                addBusinessClient({ parentId: tenant.id, ...form })
                setForm({ name: '', slug: '', planId: 'presence', ownerName: '', ownerEmail: '' })
              }}
            >
              Create sub-account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResellerTeam() {
  const tenant = currentTenant()!
  const members = usersInTenant(tenant.id)
  return (
    <div>
      <PageTitle title="Team" sub="Reseller staff with access to this agency tenant." />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(({ user, role }) => (
              <tr key={user.id + role}>
                <td>{user.name}</td>
                <td className="mono">{user.email}</td>
                <td>
                  <span className="badge">{role.replaceAll('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Invite (phase 2)</h3>
        <p className="muted">Email invite + seat limits will bind to real auth. Demo shows membership model only.</p>
      </div>
    </div>
  )
}

export function ResellerBilling() {
  const tenant = currentTenant()!
  const clients = businessesUnder(tenant.id)
  return (
    <div>
      <PageTitle title="Billing" sub="Your Agency subscription + client plan mix." />
      <div className="grid stats">
        <Stat label="Your Agency fee" value={money(tenant.mrrCents)} hint="Paid to Northstar" />
        <Stat label="Clients billed" value={clients.length} />
        <Stat label="Client MRR book" value={money(clients.reduce((s, c) => s + c.mrrCents, 0))} />
        <Stat label="Status" value={tenant.status} />
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Rebilling note</h3>
        <p className="muted">
          GHL-style SaaS mode: you set client prices; platform bills or you invoice. Northstar v1 tracks plan assignment;
          Stripe Connect / Gumroad seats = next backend milestone.
        </p>
      </div>
    </div>
  )
}

export function ResellerActivity() {
  const tenant = currentTenant()!
  const events = activityFor(tenant.id, true)
  return (
    <div>
      <PageTitle title="Activity" />
      <div className="card">
        {events.map((e) => (
          <div key={e.id} className="list-item">
            <div>
              <strong style={{ color: '#fff' }}>{e.message}</strong>
              <div className="muted" style={{ fontSize: '0.78rem' }}>
                {new Date(e.at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResellerSettings() {
  const tenant = currentTenant()!
  return (
    <div>
      <PageTitle title="Agency settings" sub="White-label fields reserved for phase 2." />
      <div className="card stack">
        <div>
          <label>Agency name</label>
          <input defaultValue={tenant.name} />
        </div>
        <div>
          <label>Slug</label>
          <input defaultValue={tenant.slug} disabled />
        </div>
        <div>
          <label>Brand color</label>
          <input defaultValue={tenant.brandColor || '#F5B700'} />
        </div>
        <div>
          <label>Custom domain (phase 2)</label>
          <input placeholder="app.youragency.com" disabled />
        </div>
        <button className="btn ghost" type="button">
          Save (demo no-op)
        </button>
      </div>
    </div>
  )
}

/* ---------------- Business ---------------- */
export function BusinessHome() {
  const tenant = currentTenant()!
  const plan = planOf(tenant.planId)
  const drafts = draftsFor(tenant.id)
  const leads = leadsFor(tenant.id)
  const accounts = accountsFor(tenant.id)
  const pending = drafts.filter((d) => d.status === 'pending').length
  return (
    <div>
      <PageTitle title={tenant.name} sub={`${plan.name} · ${plan.tagline}`} />
      <div className="grid stats">
        <Stat label="Plan" value={plan.name} hint={plan.priceMonthly ? `$${plan.priceMonthly}/mo` : 'one-time / trial'} />
        <Stat label="Accounts connected" value={`${accounts.filter((a) => a.signedIn).length}/${accounts.length || 0}`} />
        <Stat label="Drafts pending" value={pending} />
        <Stat label="Leads" value={plan.leadGen ? leads.length : '—'} hint={plan.leadGen ? 'Pipeline feature' : 'Upgrade to Pipeline'} />
      </div>
      <div className="grid two" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Next actions</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {!tenant.superGrokOk && (
              <div className="check-row">
                <span className="dot warn" />
                <div>
                  <strong style={{ color: '#fff' }}>Confirm SuperGrok</strong>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    Required prerequisite — you pay model, we don’t resell Grok
                  </div>
                </div>
                <button className="btn sm" onClick={() => toggleSuperGrok(tenant.id)}>
                  Mark OK
                </button>
              </div>
            )}
            {pending > 0 && (
              <div className="check-row">
                <span className="dot warn" />
                <div>
                  <strong style={{ color: '#fff' }}>Approve {pending} draft(s)</strong>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    Nothing public until you say yes
                  </div>
                </div>
                <Link className="btn sm" to="/app/business/drafts">
                  Open
                </Link>
              </div>
            )}
            {tenant.status === 'onboarding' && (
              <div className="check-row">
                <span className="dot warn" />
                <div>
                  <strong style={{ color: '#fff' }}>Finish onboarding</strong>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    Checklist unlocks live caps
                  </div>
                </div>
                <Link className="btn sm" to="/app/business/onboarding">
                  Open
                </Link>
              </div>
            )}
            {tenant.superGrokOk && pending === 0 && tenant.status === 'active' && (
              <div className="empty">You're clear — agents run within caps. Check Slack for day-to-day command.</div>
            )}
          </div>
        </div>
        <div className="card">
          <h3>Plan includes</h3>
          <ul className="muted" style={{ paddingLeft: 18 }}>
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function BusinessOnboarding() {
  const tenant = currentTenant()!
  const accounts = accountsFor(tenant.id)
  const steps = [
    { key: 'grok', done: tenant.superGrokOk, title: 'Confirm SuperGrok / Premium+', eta: '2 min' },
    { key: 'handles', done: accounts.length > 0, title: 'Add social handles', eta: '3 min' },
    { key: 'signin', done: accounts.some((a) => a.signedIn), title: 'Guided browser sign-in', eta: '15 min' },
    { key: 'draft', done: draftsFor(tenant.id).some((d) => d.status === 'approved' || d.status === 'posted'), title: 'Approve first draft', eta: '10 min' },
    { key: 'live', done: accounts.some((a) => a.livePosting), title: 'Optional: unlock live posting', eta: 'later' },
  ]
  const done = steps.filter((s) => s.done).length
  const pct = Math.round((done / steps.length) * 100)
  return (
    <div>
      <PageTitle title="Onboarding" sub="Paid-user setup path inside the app (not the public site)." />
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong style={{ color: '#fff' }}>
            Step progress · {done}/{steps.length}
          </strong>
          <span className="badge gold">{pct}%</span>
        </div>
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="stack" style={{ marginTop: 12 }}>
          {steps.map((s) => (
            <div key={s.key} className={`check-row${s.done ? ' done' : ''}`}>
              <span className={`dot ${s.done ? 'ok' : 'warn'}`} />
              <div>
                <strong style={{ color: '#fff' }}>{s.title}</strong>
              </div>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                {s.done ? 'Done' : s.eta}
              </span>
            </div>
          ))}
        </div>
        {tenant.status === 'onboarding' && pct >= 60 && (
          <button className="btn" style={{ marginTop: 14 }} onClick={() => setTenantStatus(tenant.id, 'active')}>
            Mark workspace active
          </button>
        )}
      </div>
    </div>
  )
}

export function BusinessAccounts() {
  const tenant = currentTenant()!
  const accounts = accountsFor(tenant.id)
  return (
    <div>
      <PageTitle title="Social accounts" sub="Handles + session status. Passwords never collected here." />
      {accounts.length === 0 ? (
        <div className="empty">No accounts yet — add handles during onboarding.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Handle</th>
                <th>Signed in</th>
                <th>Live posting</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td>{a.platform}</td>
                  <td className="mono">{a.handle}</td>
                  <td>
                    <button className="btn ghost sm" onClick={() => toggleAccountSignedIn(a.id)}>
                      {a.signedIn ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td>
                    <button className="btn ghost sm" onClick={() => toggleLivePosting(a.id)}>
                      {a.livePosting ? 'ON' : 'OFF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function BusinessDrafts() {
  const tenant = currentTenant()!
  const drafts = draftsFor(tenant.id)
  return (
    <div>
      <PageTitle title="Drafts" sub="Approve before anything is public." />
      <div className="stack">
        {drafts.length === 0 && <div className="empty">No drafts yet — writer lane will land them here.</div>}
        {drafts.map((d) => (
          <div className="card" key={d.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>
                {d.platform} · {d.title}
              </h3>
              <span className={`badge ${d.status === 'pending' ? 'warn' : d.status === 'posted' ? 'ok' : 'info'}`}>
                {d.status}
              </span>
            </div>
            <p className="muted">{d.body}</p>
            {d.status === 'pending' && (
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm" onClick={() => setDraftStatus(d.id, 'approved')}>
                  Approve
                </button>
                <button className="btn ghost sm" onClick={() => setDraftStatus(d.id, 'rejected')}>
                  Reject
                </button>
                <button className="btn ghost sm" onClick={() => setDraftStatus(d.id, 'posted')}>
                  Mark posted
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function BusinessLeads() {
  const tenant = currentTenant()!
  const plan = planOf(tenant.planId)
  const leads = leadsFor(tenant.id)
  if (!plan.leadGen) {
    return (
      <div>
        <PageTitle title="Leads" sub="Lead inbox is part of Pipeline (individual + lead gen) and Agency." />
        <div className="empty">
          Your plan is <strong style={{ color: '#fff' }}>{plan.name}</strong>. Upgrade to Pipeline ($249) to unlock lead
          inbox + outreach drafts.
        </div>
      </div>
    )
  }
  return (
    <div>
      <PageTitle title="Leads" sub="From comments, replies, and outreach drafts." />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Source</th>
              <th>Status</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.source}</td>
                <td>
                  <Status s={l.status} />
                </td>
                <td className="muted">{l.note}</td>
                <td>
                  <select value={l.status} onChange={(e) => setLeadStatus(l.id, e.target.value as any)} style={{ marginBottom: 0 }}>
                    <option value="new">new</option>
                    <option value="qualified">qualified</option>
                    <option value="contacted">contacted</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BusinessTeam() {
  const tenant = currentTenant()!
  const members = usersInTenant(tenant.id)
  return (
    <div>
      <PageTitle title="Team" sub="Business owner + members on this workspace." />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(({ user, role }) => (
              <tr key={user.id + role}>
                <td>{user.name}</td>
                <td className="mono">{user.email}</td>
                <td>
                  <span className="badge">{String(role).replaceAll('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BusinessSettings() {
  const tenant = currentTenant()!
  return (
    <div>
      <PageTitle title="Workspace settings" />
      <div className="card stack">
        <div>
          <label>Workspace name</label>
          <input defaultValue={tenant.name} />
        </div>
        <div>
          <label>Slug</label>
          <input defaultValue={tenant.slug} disabled />
        </div>
        <div>
          <label>Plan</label>
          <input defaultValue={planOf(tenant.planId).name} disabled />
        </div>
        <button className="btn ghost" type="button">
          Save (demo no-op)
        </button>
      </div>
    </div>
  )
}
