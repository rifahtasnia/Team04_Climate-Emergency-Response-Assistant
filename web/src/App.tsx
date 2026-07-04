import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AccountabilityPage } from './pages/AccountabilityPage'
import { AlertPage } from './pages/AlertPage'
import { IncidentPage } from './pages/IncidentPage'
import { OperationsPage } from './pages/OperationsPage'
import { PartnerSupportPage } from './pages/PartnerSupportPage'
import { ResidentHelpPage } from './pages/ResidentHelpPage'
import { ResponsePage } from './pages/ResponsePage'
import { RoleGatewayPage } from './pages/RoleGatewayPage'
import { OperationsProvider } from './state/OperationsContext'
import { ResponseNetworkProvider } from './state/ResponseNetworkContext'

export default function App() {
  return (
    <BrowserRouter>
      <ResponseNetworkProvider>
        <OperationsProvider>
          <Routes>
            <Route path="/" element={<RoleGatewayPage />} />
            <Route path="/help" element={<ResidentHelpPage />} />
            <Route path="/support" element={<PartnerSupportPage />} />
            <Route path="/operations" element={<AppShell><OperationsPage /></AppShell>} />
            <Route path="/operations/incident" element={<AppShell><IncidentPage /></AppShell>} />
            <Route path="/operations/response" element={<AppShell><ResponsePage /></AppShell>} />
            <Route path="/operations/alert" element={<AppShell><AlertPage /></AppShell>} />
            <Route path="/operations/accountability" element={<AppShell><AccountabilityPage /></AppShell>} />
            <Route path="/incident" element={<Navigate to="/operations/incident" replace />} />
            <Route path="/response" element={<Navigate to="/operations/response" replace />} />
            <Route path="/alert" element={<Navigate to="/operations/alert" replace />} />
            <Route path="/accountability" element={<Navigate to="/operations/accountability" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OperationsProvider>
      </ResponseNetworkProvider>
    </BrowserRouter>
  )
}
