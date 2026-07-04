import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BellRing,
  ChevronDown,
  CircleUserRound,
  ClipboardCheck,
  Map,
  Radio,
  Route,
  X,
} from 'lucide-react'
import { useOperations } from '../state/OperationsContext'
import { AegisMark } from './AegisMark'
import { OperationsSetup } from './OperationsSetup'
import { StatusBadge } from './StatusBadge'

const navigation = [
  { to: '/operations', label: 'Live operations', icon: Map },
  { to: '/operations/incident', label: 'Incident room', icon: Radio },
  { to: '/operations/response', label: 'Response plan', icon: Route },
  { to: '/operations/alert', label: 'Public alert', icon: BellRing },
  { to: '/operations/accountability', label: 'Accountability', icon: ClipboardCheck },
]

const stageLabel = {
  review: 'Review required',
  verified: 'Incident verified',
  planned: 'Plan ready',
  approved: 'Response active',
  published: 'Warning content approved',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { configured, city, operatorName, stage, weather } = useOperations()
  const [clock, setClock] = useState('')
  const [zoneLabel, setZoneLabel] = useState('')
  const [setupOpen, setSetupOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const timezone = weather?.timezone ?? city?.timezone ?? 'UTC'

  useEffect(() => {
    const updateClock = () => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
        timeZoneName: 'short',
      }).formatToParts(new Date())
      setClock(
        parts
          .filter((part) => ['hour', 'minute', 'second', 'literal'].includes(part.type))
          .map((part) => part.value)
          .join('')
          .replace(/\s/g, ''),
      )
      setZoneLabel(parts.find((part) => part.type === 'timeZoneName')?.value ?? '')
    }
    updateClock()
    const timer = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(timer)
  }, [timezone])

  if (!configured) {
    return (
      <div className="setup-shell">
        <header className="topbar setup-topbar">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <AegisMark size={21} />
            </span>
            <span>AEGIS</span>
          </Link>
        </header>
        <main className="setup-main">
          <OperationsSetup />
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <AegisMark size={21} />
          </span>
          <span>AEGIS</span>
        </Link>
        <button
          className="city-selector"
          type="button"
          aria-label={`Current jurisdiction: ${city?.name}. Start another operation`}
          onClick={() => setSetupOpen(true)}
        >
          {city?.name} Emergency Operations
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <div className="topbar-spacer" />
        <StatusBadge tone={stage === 'review' ? 'critical' : 'success'}>
          <span className="badge-dot" aria-hidden="true" />
          {stageLabel[stage]}
        </StatusBadge>
        <span className="system-clock" aria-label={`${city?.name} time ${clock}`}>
          {clock} {zoneLabel}
        </span>
        <button
          className="icon-button"
          type="button"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen((current) => !current)}
        >
          <BellRing size={18} />
          <span className="notification-dot" aria-hidden="true" />
        </button>
        <span className="profile-button" aria-label={`Signed in as ${operatorName}`}>
          <CircleUserRound size={20} />
          <span>{operatorName}</span>
        </span>
        {notificationsOpen && (
          <div className="notification-panel">
            <p className="eyebrow">OPERATION STATUS</p>
            <strong>{stageLabel[stage]}</strong>
            <span>{city?.displayName}</span>
            <small>
              {weather
                ? `Weather updated ${weather.observedAt} · ${weather.source}`
                : 'Current weather unavailable'}
            </small>
          </div>
        )}
      </header>

      <aside className="sidebar">
        <nav aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/operations'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-status">
          <Radio size={16} aria-hidden="true" />
          <div>
            <strong>Operational</strong>
            <span>Location services connected</span>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {setupOpen && (
        <div className="setup-dialog-backdrop" role="presentation">
          <div className="setup-dialog" role="dialog" aria-modal="true" aria-label="Start another operation">
            <button
              className="dialog-close"
              type="button"
              onClick={() => setSetupOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <OperationsSetup compact onCancel={() => setSetupOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
