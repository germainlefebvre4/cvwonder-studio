import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/Tooltip'
import '@/app/globals.css'
import LandingPage from '@/app/page'
import StudioPage from '@/app/studio/page'
import RequireAdmin from '@/components/admin/RequireAdmin'
import RequireUser from '@/components/user/RequireUser'
import AdminLayout from '@/components/admin/AdminLayout'
import Login from '@/pages/admin/Login'
import Dashboard from '@/pages/admin/Dashboard'
import InstalledThemes from '@/pages/admin/themes/InstalledThemes'
import Catalog from '@/pages/admin/themes/Catalog'
import Sessions from '@/pages/admin/Sessions'
import System from '@/pages/admin/System'
import UserLogin from '@/pages/user/Login'
import UserDashboard from '@/pages/user/Dashboard'
import SharedSession from '@/pages/user/SharedSession'
import PublicViewer from '@/pages/user/PublicViewer'
import SessionExpired from '@/pages/user/SessionExpired'
import AccountPage from '@/pages/user/Account'
import AppInit from '@/components/user/AppInit'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <AppInit />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/studio/:token" element={<StudioPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/404-session" element={<SessionExpired />} />
          {/* Public viewer served by backend - this SPA route is a fallback */}
          <Route path="/viewer/:id" element={<PublicViewer />} />
          {/* Shared session */}
          <Route path="/s/:id/:token" element={<SharedSession />} />
          {/* User dashboard */}
          <Route
            path="/dashboard"
            element={
              <RequireUser>
                <UserDashboard />
              </RequireUser>
            }
          />
          <Route
            path="/account"
            element={
              <RequireUser>
                <AccountPage />
              </RequireUser>
            }
          />
          {/* Admin */}
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/*"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="themes" element={<InstalledThemes />} />
                    <Route path="themes/catalog" element={<Catalog />} />
                    <Route path="sessions" element={<Sessions />} />
                    <Route path="system" element={<System />} />
                  </Routes>
                </AdminLayout>
              </RequireAdmin>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>,
)
