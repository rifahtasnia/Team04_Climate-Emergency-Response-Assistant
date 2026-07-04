import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CloudRain,
  Droplets,
  HandHeart,
  Home,
  MapPin,
  Radio,
  UsersRound,
  Wind,
} from 'lucide-react'
import { OperationsMap } from '../components/OperationsMap'
import { StatusBadge } from '../components/StatusBadge'
import { useOperations } from '../state/OperationsContext'
import { useResponseNetwork } from '../state/ResponseNetworkContext'

export function OperationsPage() {
  const navigate = useNavigate()
  const {
    city,
    hazard,
    incidents,
    resources,
    selectedIncident,
    weather,
    weatherLoading,
    loadWeather,
  } = useOperations()
  const {
    volunteerOffers,
    shelterOffers,
    verifyVolunteerOffer,
    verifyShelterOffer,
  } = useResponseNetwork()
  const verifiedSupply =
    volunteerOffers.filter((offer) => offer.verified).length +
    shelterOffers.filter((offer) => offer.verified).length

  useEffect(() => {
    if (!weather && !weatherLoading) void loadWeather()
  }, [weather, weatherLoading, loadWeather])

  const closureCount =
    selectedIncident?.reports.filter((report) =>
      /closure|closed|blocked|impassable|road/i.test(`${report.label} ${report.text}`),
    ).length ?? 0

  return (
    <div className="page operations-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CITYWIDE SITUATION</p>
          <h1>Live operations</h1>
        </div>
        <div className="weather-inline" aria-label="Current weather">
          <CloudRain size={20} aria-hidden="true" />
          <div>
            <strong>
              {weatherLoading
                ? 'Updating'
                : weather
                  ? `${weather.temperature}°C`
                  : 'Unavailable'}
            </strong>
            <span>
              {weather
                ? `${weather.precipitation} mm precipitation · ${weather.windSpeed} km/h wind`
                : `Current conditions for ${city?.name} could not be loaded`}
            </span>
          </div>
        </div>
      </div>

      <section className="operational-brief" aria-labelledby="brief-title">
        <div className="brief-icon"><Droplets size={22} /></div>
        <div>
          <p className="eyebrow">{hazard.toUpperCase()} RESPONSE · LIVE INTAKE</p>
          <h2 id="brief-title">{selectedIncident?.title}</h2>
          <p>
            {selectedIncident?.reportCount} submitted report
            {selectedIncident?.reportCount === 1 ? '' : 's'} require verification
            before local response capabilities can be assigned.
          </p>
        </div>
        <StatusBadge tone="critical">Immediate review</StatusBadge>
      </section>

      <div className="metric-row" aria-label="Operational summary">
        <article className="metric">
          <Radio size={18} aria-hidden="true" />
          <div><strong>{incidents.length}</strong><span>Active incidents</span></div>
          <small>{incidents.filter((incident) => incident.severity === 'critical').length} critical</small>
        </article>
        <article className="metric">
          <UsersRound size={18} aria-hidden="true" />
          <div><strong>{resources.length}</strong><span>Capabilities required</span></div>
          <small>{verifiedSupply} verified offers</small>
        </article>
        <article className="metric">
          <Wind size={18} aria-hidden="true" />
          <div><strong>{closureCount}</strong><span>Access disruptions</span></div>
          <small>From submitted reports</small>
        </article>
      </div>

      <div className="operations-grid">
        <OperationsMap />
        <section className="incident-queue" aria-labelledby="queue-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PRIORITY QUEUE</p>
              <h2 id="queue-title">Incidents</h2>
            </div>
            <span>{incidents.length} active</span>
          </div>
          <div className="queue-list">
            {incidents.map((incident, index) => (
              <button
                type="button"
                className="queue-item"
                key={incident.id}
                onClick={() => index === 0 && navigate('/operations/incident')}
              >
                <div className="queue-item-top">
                  <StatusBadge
                    tone={
                      incident.severity === 'critical'
                        ? 'critical'
                        : incident.severity === 'high'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {incident.severity}
                  </StatusBadge>
                  <span>{incident.updated}</span>
                </div>
                <strong>{incident.title}</strong>
                <span className="queue-location">
                  <MapPin size={14} aria-hidden="true" />
                  {incident.location}
                </span>
                <div className="queue-meta">
                  <span>{incident.reportCount} reports</span>
                  <span>{incident.confidence}% confidence</span>
                  {index === 0 && <ArrowRight size={16} aria-hidden="true" />}
                </div>
              </button>
            ))}
          </div>
          {(volunteerOffers.length > 0 || shelterOffers.length > 0) && (
            <div className="network-offers">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">COMMUNITY CAPACITY</p>
                  <h2>Offers to verify</h2>
                </div>
                <span>{volunteerOffers.length + shelterOffers.length}</span>
              </div>
              {volunteerOffers.map((offer) => (
                <article key={offer.id}>
                  <HandHeart size={16} />
                  <p><strong>{offer.volunteerName}</strong><span>{offer.skills.join(' · ')}</span></p>
                  {offer.verified ? (
                    <em><Check size={13} />Verified</em>
                  ) : (
                    <button type="button" onClick={() => verifyVolunteerOffer(offer.id)}>Verify</button>
                  )}
                </article>
              ))}
              {shelterOffers.map((offer) => (
                <article key={offer.id}>
                  <Home size={16} />
                  <p><strong>{offer.providerName}</strong><span>{offer.spaces} spaces · {offer.accessible ? 'step-free' : 'accessibility unconfirmed'}</span></p>
                  {offer.verified ? (
                    <em><Check size={13} />Verified</em>
                  ) : (
                    <button type="button" onClick={() => verifyShelterOffer(offer.id)}>Verify</button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
