import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components'
import { useAppState } from './hooks'
import {
  BusinessAccounts,
  BusinessDrafts,
  BusinessHome,
  BusinessLeads,
  BusinessOnboarding,
  BusinessSettings,
  BusinessTeam,
  LoginPage,
  PlatformActivity,
  PlatformBusinesses,
  PlatformHome,
  PlatformPlans,
  PlatformResellers,
  PlatformUsers,
  ResellerActivity,
  ResellerBilling,
  ResellerClients,
  ResellerHome,
  ResellerSettings,
  ResellerTeam,
} from './pages'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const state = useAppState()
  if (!state.session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function HomeRedirect() {
  const state = useAppState()
  if (!state.session) return <Navigate to="/login" replace />
  const t = state.tenants.find((x) => x.id === state.session!.activeTenantId)
  if (!t) return <Navigate to="/login" replace />
  if (t.kind === 'platform') return <Navigate to="/app/platform" replace />
  if (t.kind === 'reseller') return <Navigate to="/app/reseller" replace />
  return <Navigate to="/app/business" replace />
}

export default function App() {
  return (
    <BrowserRouter basename="/northstar-agents/app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="platform" element={<PlatformHome />} />
          <Route path="platform/resellers" element={<PlatformResellers />} />
          <Route path="platform/businesses" element={<PlatformBusinesses />} />
          <Route path="platform/users" element={<PlatformUsers />} />
          <Route path="platform/plans" element={<PlatformPlans />} />
          <Route path="platform/activity" element={<PlatformActivity />} />

          <Route path="reseller" element={<ResellerHome />} />
          <Route path="reseller/clients" element={<ResellerClients />} />
          <Route path="reseller/team" element={<ResellerTeam />} />
          <Route path="reseller/billing" element={<ResellerBilling />} />
          <Route path="reseller/activity" element={<ResellerActivity />} />
          <Route path="reseller/settings" element={<ResellerSettings />} />

          <Route path="business" element={<BusinessHome />} />
          <Route path="business/onboarding" element={<BusinessOnboarding />} />
          <Route path="business/accounts" element={<BusinessAccounts />} />
          <Route path="business/drafts" element={<BusinessDrafts />} />
          <Route path="business/leads" element={<BusinessLeads />} />
          <Route path="business/team" element={<BusinessTeam />} />
          <Route path="business/settings" element={<BusinessSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
