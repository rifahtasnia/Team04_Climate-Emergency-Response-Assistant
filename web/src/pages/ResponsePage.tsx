import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clock3,
  HandHeart,
  Home,
  MapPin,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { OperationsMap } from '../components/OperationsMap'
import { StatusBadge } from '../components/StatusBadge'
import { useOperations } from '../state/OperationsContext'
import { useResponseNetwork } from '../state/ResponseNetworkContext'
import type { RouteSnapshot } from '../types'
import { distanceKm } from '../utils/geo'

export function ResponsePage() {
  const navigate = useNavigate()
  const {
    selectedIncident,
    resources,
    sourceRequestId,
    stage,
    approvePlan,
  } = useOperations()
  const {
    volunteerOffers,
    shelterOffers,
    updateRequestStatus,
  } = useResponseNetwork()
  const [routeSummary, setRouteSummary] = useState<RouteSnapshot | null>(null)
  const approved = stage === 'approved' || stage === 'published'
  if (!selectedIncident) return null
  const matchedVolunteers = volunteerOffers.filter(
    (offer) =>
      offer.verified &&
      offer.available &&
      distanceKm(selectedIncident.coordinate, offer.location.coordinate) <=
        offer.travelRadiusKm,
  )
  const matchedShelters = shelterOffers.filter(
    (offer) =>
      offer.verified &&
      offer.available &&
      offer.spaces > 0 &&
      distanceKm(selectedIncident.coordinate, offer.location.coordinate) <= 25,
  )

  return (
    <div className="page response-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INCIDENT {selectedIncident.shortId}</p>
          <h1>Response plan</h1>
          <p className="heading-meta">
            <MapPin size={15} /> {selectedIncident.location}
          </p>
        </div>
        <StatusBadge tone={approved ? 'success' : 'info'}>
          {approved ? 'Approved' : 'Ready for approval'}
        </StatusBadge>
      </div>

      <div className="response-layout">
        <OperationsMap
          focus={selectedIncident.coordinate}
          route
          onRouteLoaded={setRouteSummary}
        />
        <aside className="response-sidebar">
          <section className="panel route-summary">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RECOMMENDED APPROACH</p>
                <h2>Fastest available access</h2>
              </div>
              <Route size={21} />
            </div>
            <div className="route-stats">
              <div><strong>{routeSummary ? `${routeSummary.duration} min` : 'Calculating'}</strong><span>Estimated travel</span></div>
              <div><strong>{routeSummary ? `${routeSummary.distance} km` : '—'}</strong><span>Travel distance</span></div>
            </div>
            <p>
              Calculated from the selected incident coordinates using the current
              road network. Field confirmation is required before dispatch.
            </p>
          </section>

          <section className="panel assignments-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ASSIGNMENTS</p>
                <h2>Coordinated resources</h2>
              </div>
              <span>{resources.length + matchedVolunteers.length + matchedShelters.length} resources</span>
            </div>
            <div className="assignment-list">
              {resources.map((resource) => (
                <article key={resource.id}>
                  <span className="assignment-check"><Check size={14} /></span>
                  <div>
                    <strong>{resource.name}</strong>
                    <span>{resource.type}</span>
                    <small>{resource.detail}</small>
                  </div>
                  <span className="eta"><Clock3 size={13} />Assign locally</span>
                </article>
              ))}
              {matchedVolunteers.map((offer) => (
                <article key={offer.id}>
                  <span className="assignment-check"><HandHeart size={14} /></span>
                  <div>
                    <strong>{offer.volunteerName}</strong>
                    <span>Verified volunteer</span>
                    <small>{offer.skills.join(' · ')}</small>
                  </div>
                  <span className="eta">{distanceKm(selectedIncident.coordinate, offer.location.coordinate).toFixed(1)} km</span>
                </article>
              ))}
              {matchedShelters.map((offer) => (
                <article key={offer.id}>
                  <span className="assignment-check"><Home size={14} /></span>
                  <div>
                    <strong>{offer.providerName}</strong>
                    <span>Verified shelter</span>
                    <small>{offer.spaces} spaces · {offer.accessible ? 'step-free' : 'accessibility unconfirmed'}</small>
                  </div>
                  <span className="eta">{distanceKm(selectedIncident.coordinate, offer.location.coordinate).toFixed(1)} km</span>
                </article>
              ))}
            </div>
          </section>

          <section className="approval-bar">
            <div>
              <ShieldCheck size={20} />
              <p><strong>Human authorization required</strong><span>Capabilities remain recommendations until matched to local inventory.</span></p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (!approved) approvePlan()
                if (sourceRequestId) updateRequestStatus(sourceRequestId, 'Matched')
                navigate('/operations/alert')
              }}
            >
              {approved ? 'Continue to public alert' : 'Approve response plan'}
              <ArrowRight size={17} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
