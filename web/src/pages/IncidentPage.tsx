import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { useOperations } from '../state/OperationsContext'

export function IncidentPage() {
  const navigate = useNavigate()
  const {
    selectedIncident,
    stage,
    verifyIncident,
    overridePriority,
    assessment,
    assessmentLoading,
    refreshAssessment,
  } = useOperations()
  const [traceOpen, setTraceOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  useEffect(() => {
    if (!assessment && !assessmentLoading) void refreshAssessment()
  }, [assessment, assessmentLoading, refreshAssessment])

  const verified = stage !== 'review'
  if (!selectedIncident) return null
  const corroborated = selectedIncident.reports.filter(
    (report) => report.verification === 'corroborated',
  ).length
  const unresolved = selectedIncident.reports.length - corroborated

  return (
    <div className="page incident-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INCIDENT {selectedIncident.shortId}</p>
          <h1>{selectedIncident.title}</h1>
          <p className="heading-meta">
            <MapPin size={15} /> {selectedIncident.location} · Updated {selectedIncident.updated}
          </p>
        </div>
        <div className="heading-actions">
          <StatusBadge tone="critical">Critical</StatusBadge>
          <StatusBadge tone={verified ? 'success' : 'warning'}>
            {verified ? 'Verified' : 'Verification required'}
          </StatusBadge>
        </div>
      </div>

      <div className="incident-layout">
        <div className="incident-primary">
          <section className="panel incident-summary">
            <div className="section-heading">
              <div>
                <p className="eyebrow">COMMON OPERATING PICTURE</p>
                <h2>What we know</h2>
              </div>
              <span className="source-label">
                {assessmentLoading ? 'Assessing reports…' : assessment?.source ?? 'Rules engine'}
              </span>
            </div>
            <p className="summary-lede">
              {assessment?.summary ?? selectedIncident.summary}
            </p>
            <div className="fact-grid">
              <div><UsersRound size={18} /><strong>{selectedIncident.peopleAtRisk || '—'}</strong><span>People explicitly reported</span></div>
              <div><ShieldCheck size={18} /><strong>{corroborated}</strong><span>Corroborated reports</span></div>
              <div><CircleAlert size={18} /><strong>{unresolved}</strong><span>Unresolved reports</span></div>
            </div>
            <div className="assessment-columns">
              <div>
                <h3>Immediate needs</h3>
                <ul className="check-list">
                  {(assessment?.needs ?? ['Rapid field assessment']).map(
                    (need) => <li key={need}><Check size={15} />{need}</li>,
                  )}
                </ul>
              </div>
              <div>
                <h3>Known hazards</h3>
                <ul className="hazard-list">
                  {(assessment?.hazards ?? ['Conditions require field verification']).map(
                    (hazard) => <li key={hazard}><CircleAlert size={15} />{hazard}</li>,
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section className="panel evidence-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">EVIDENCE</p>
                <h2>Reports and corroboration</h2>
              </div>
              <span>{selectedIncident.reports.length} shown</span>
            </div>
            <div className="evidence-list">
              {selectedIncident.reports.map((report) => (
                <article className="evidence-item" key={report.id}>
                  <div className="evidence-time">{report.time}</div>
                  <div>
                    <div className="evidence-source">
                      <strong>{report.source}</strong>
                      <span>{report.label}</span>
                    </div>
                    <p>{report.text}</p>
                  </div>
                  <StatusBadge
                    tone={report.verification === 'corroborated' ? 'success' : 'warning'}
                  >
                    {report.verification}
                  </StatusBadge>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="incident-decision">
          <section className="panel decision-panel">
            <p className="eyebrow">DECISION REQUIRED</p>
            <h2>Verify incident</h2>
            <p>
              Submitted reports support escalation for human review. Claims without
              independent support remain explicitly unverified.
            </p>
            <div className="confidence-block">
              <div><span>Assessment confidence</span><strong>{assessment?.confidence ?? selectedIncident.confidence}%</strong></div>
              <div className="confidence-track"><span style={{ width: `${assessment?.confidence ?? selectedIncident.confidence}%` }} /></div>
              <small>Confidence measures evidence agreement, not incident severity.</small>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                if (!verified) verifyIncident()
                navigate('/operations/response')
              }}
            >
              {verified ? 'Continue to response plan' : 'Verify and build response'}
              <ArrowRight size={17} />
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setOverrideOpen((current) => !current)}
            >
              Review priority
            </button>
            {overrideOpen && (
              <form
                className="override-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!overrideReason.trim()) return
                  overridePriority(overrideReason.trim())
                  setOverrideOpen(false)
                  setOverrideReason('')
                }}
              >
                <label htmlFor="override-reason">Reason for review</label>
                <textarea
                  id="override-reason"
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Record the evidence behind your decision"
                  required
                />
                <button type="submit" className="compact-button">Record decision</button>
              </form>
            )}
          </section>

          <section className="panel trace-panel">
            <button
              type="button"
              className="trace-toggle"
              onClick={() => setTraceOpen((current) => !current)}
              aria-expanded={traceOpen}
            >
              <span><RefreshCw size={16} /> Decision trace</span>
              <ChevronDown size={16} className={traceOpen ? 'rotated' : ''} />
            </button>
            {traceOpen && (
              <ol>
                <li><strong>Signal</strong><span>{selectedIncident.reportCount} submitted reports grouped by location</span></li>
                <li><strong>Verify</strong><span>{corroborated} reports currently corroborated</span></li>
                <li><strong>Prioritize</strong><span>Risk language produced a {selectedIncident.severity} recommendation</span></li>
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
