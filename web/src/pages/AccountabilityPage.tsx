import { useEffect, useState } from 'react'
import {
  BarChart3,
  Check,
  Database,
  Globe2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { useOperations } from '../state/OperationsContext'
import type { DatasetSummary } from '../types'

export function AccountabilityPage() {
  const { decisions, resources, selectedIncident, stage } = useOperations()
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null)
  const humanDecisions = decisions.filter((decision) => decision.type === 'human').length

  useEffect(() => {
    fetch('/api/datasets')
      .then((response) => {
        if (!response.ok) throw new Error('Dataset summary unavailable')
        return response.json()
      })
      .then(setDatasetSummary)
      .catch(() => setDatasetSummary(null))
  }, [])

  if (!selectedIncident) return null
  const accessibilitySignals = selectedIncident.reports.some((report) =>
    /wheelchair|mobility|accessible|elevator|disability/i.test(report.text),
  )
  const accessibleCapability = resources.some((resource) =>
    /accessible/i.test(`${resource.name} ${resource.type}`),
  )
  const accessibilityChecks = [
    accessibilitySignals,
    accessibleCapability,
    stage === 'published',
  ].filter(Boolean).length

  return (
    <div className="page accountability-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INCIDENT {selectedIncident.shortId}</p>
          <h1>Accountability</h1>
          <p className="heading-meta">Evidence, decisions, and coverage review</p>
        </div>
        <StatusBadge tone={stage === 'published' ? 'success' : 'info'}>
          Record complete
        </StatusBadge>
      </div>

      <div className="accountability-summary">
        <article><ShieldCheck size={20} /><div><strong>{humanDecisions}</strong><span>Human decisions</span></div></article>
        <article><Database size={20} /><div><strong>{selectedIncident.reportCount}</strong><span>Evidence records</span></div></article>
        <article><UsersRound size={20} /><div><strong>{accessibilityChecks}</strong><span>Accessibility checks</span></div></article>
      </div>

      <div className="accountability-layout">
        <section className="panel decision-history">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DECISION RECORD</p>
              <h2>Incident timeline</h2>
            </div>
            <span>{decisions.length} entries</span>
          </div>
          <ol>
            {decisions.map((decision) => (
              <li key={decision.id} className={`decision-${decision.type}`}>
                <time>{decision.time}</time>
                <span className="timeline-node" />
                <div>
                  <div className="decision-actor">
                    <strong>{decision.actor}</strong>
                    <StatusBadge tone={decision.type === 'human' ? 'success' : 'info'}>
                      {decision.type === 'human' ? 'Authorized' : decision.type}
                    </StatusBadge>
                  </div>
                  <h3>{decision.action}</h3>
                  <p>{decision.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="accountability-aside">
          <section className="panel equity-review">
            <div className="section-heading">
              <div>
                <p className="eyebrow">COVERAGE REVIEW</p>
                <h2>Who could be missed?</h2>
              </div>
              <Globe2 size={20} />
            </div>
            <ul className="check-list">
              {accessibleCapability && <li><Check size={15} />Mobility support included in required capabilities</li>}
              {stage === 'published' && <li><Check size={15} />English and French warning content approved</li>}
              <li><Check size={15} />Low-reporting areas not treated as safe</li>
            </ul>
            <div className="coverage-warning">
              <strong>Follow-up required</strong>
              <span>Confirm door-to-door support for residents without mobile access.</span>
            </div>
          </section>

          <section className="panel context-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PREPAREDNESS CONTEXT</p>
                <h2>Evidence behind policy</h2>
              </div>
              <BarChart3 size={20} />
            </div>
            <div className="context-stat">
              <strong>
                {datasetSummary?.natural_disasters_from_social_media.records.toLocaleString() ?? '—'}
              </strong>
              <span>labelled disaster reports supporting the signal taxonomy</span>
            </div>
            <div className="context-stat">
              <strong>
                {datasetSummary?.transformto_resident_survey.responses.toLocaleString() ?? '—'}
              </strong>
              <span>resident survey responses informing equitable preparedness</span>
            </div>
            <details>
              <summary>Data sources</summary>
              <ul>
                <li>Natural Disasters from Social Media · {datasetSummary?.natural_disasters_from_social_media.relevant.toLocaleString() ?? '—'} relevant reports</li>
                <li>City of Toronto Current and Future Climate · {datasetSummary?.toronto_current_and_future_climate.columns ?? '—'} variables</li>
                <li>TransformTO resident survey · {datasetSummary?.transformto_resident_survey.responses.toLocaleString() ?? '—'} responses</li>
                <li>Montréal community GHG inventory · {datasetSummary?.montreal_ghg_inventory.sectors ?? '—'} sectors</li>
                <li>World Bank climate indicators · {datasetSummary?.african_climate_indicators.countries ?? '—'} countries</li>
              </ul>
            </details>
          </section>
        </aside>
      </div>
    </div>
  )
}
