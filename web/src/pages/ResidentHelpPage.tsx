import { useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  CloudRain,
  MapPin,
  Navigation,
  ShieldAlert,
} from 'lucide-react'
import { LocationSearch } from '../components/OperationsSetup'
import { PublicHeader } from '../components/PublicHeader'
import { useResponseNetwork } from '../state/ResponseNetworkContext'
import type {
  AidCategory,
  CityProfile,
  HelpRequest,
  WeatherSnapshot,
} from '../types'
import { distanceKm } from '../utils/geo'

const aidCategories: AidCategory[] = [
  'Urgent rescue',
  'Medical aid',
  'Transportation',
  'Food and water',
  'Accommodation',
  'Power support',
]

const vulnerabilityOptions = [
  'Older adult',
  'Child present',
  'Disability or mobility need',
  'Medical equipment',
  'No transportation',
]

export function ResidentHelpPage() {
  const {
    submitHelpRequest,
    volunteerOffers,
    shelterOffers,
  } = useResponseNetwork()
  const [requesterName, setRequesterName] = useState('')
  const [location, setLocation] = useState<CityProfile | null>(null)
  const [needs, setNeeds] = useState<AidCategory[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState<HelpRequest | null>(null)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)

  const selectLocation = async (selected: CityProfile | null) => {
    setLocation(selected)
    setWeather(null)
    if (!selected) return
    try {
      const parameters = new URLSearchParams({
        lat: String(selected.coordinate.lat),
        lng: String(selected.coordinate.lng),
      })
      const response = await fetch(`/api/weather?${parameters}`)
      if (response.ok) setWeather(await response.json())
    } catch {
      setWeather(null)
    }
  }

  const nearbyVolunteers = useMemo(
    () =>
      location
        ? volunteerOffers.filter(
            (offer) =>
              offer.available &&
              offer.verified &&
              distanceKm(location.coordinate, offer.location.coordinate) <=
                offer.travelRadiusKm,
          )
        : [],
    [location, volunteerOffers],
  )

  const nearbyShelters = useMemo(
    () =>
      location
        ? shelterOffers
            .filter(
              (offer) =>
                offer.available &&
                offer.verified &&
                offer.spaces > 0 &&
                distanceKm(location.coordinate, offer.location.coordinate) <= 25,
            )
            .sort(
              (a, b) =>
                distanceKm(location.coordinate, a.location.coordinate) -
                distanceKm(location.coordinate, b.location.coordinate),
            )
        : [],
    [location, shelterOffers],
  )

  const toggleNeed = (need: AidCategory) =>
    setNeeds((current) =>
      current.includes(need)
        ? current.filter((candidate) => candidate !== need)
        : [...current, need],
    )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!location || needs.length === 0) return
    setSubmitted(
      submitHelpRequest({
        requesterName: requesterName.trim(),
        location,
        needs,
        vulnerabilities,
        details: details.trim(),
      }),
    )
  }

  return (
    <div className="public-shell">
      <PublicHeader />
      <main className="public-page resident-page">
        <section className="public-page-heading">
          <div>
            <p className="eyebrow">GET HELP</p>
            <h1>Tell us what you need and where you are.</h1>
            <p>Your request goes to an authorized coordinator. Location and vulnerability details are used only for response matching.</p>
          </div>
          <div className="emergency-callout">
            <ShieldAlert size={20} />
            <p><strong>Immediate life danger?</strong><span>Contact your local emergency service now. This form does not replace emergency dispatch.</span></p>
          </div>
        </section>

        {submitted ? (
          <section className="request-confirmation">
            <CheckCircle2 size={30} />
            <p className="eyebrow">REQUEST RECEIVED</p>
            <h2>{submitted.status}</h2>
            <p>Reference {submitted.id}. A coordinator must verify the request before any volunteer or shelter is assigned.</p>
            <div className="guidance-list">
              <strong>While you wait</strong>
              <span>Move away from floodwater and electrical hazards if it is safe to do so.</span>
              <span>Keep your phone available and update responders if conditions change.</span>
              <span>Do not travel through closed roads or moving water.</span>
            </div>
          </section>
        ) : (
          <div className="resident-layout">
            <form className="setup-form public-form" onSubmit={submit}>
              <label>
                Name
                <input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} placeholder="Name or initials" />
              </label>
              <LocationSearch
                legend="Your current location"
                placeholder="Search address or nearby landmark"
                onSelect={selectLocation}
              />
              <fieldset>
                <legend>What help do you need?</legend>
                <div className="choice-grid">
                  {aidCategories.map((need) => (
                    <label key={need} className={needs.includes(need) ? 'selected' : ''}>
                      <input type="checkbox" checked={needs.includes(need)} onChange={() => toggleNeed(need)} />
                      {need}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Who may need priority support?</legend>
                <div className="choice-grid compact-choices">
                  {vulnerabilityOptions.map((option) => (
                    <label key={option} className={vulnerabilities.includes(option) ? 'selected' : ''}>
                      <input
                        type="checkbox"
                        checked={vulnerabilities.includes(option)}
                        onChange={() =>
                          setVulnerabilities((current) =>
                            current.includes(option)
                              ? current.filter((candidate) => candidate !== option)
                              : [...current, option],
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                What is happening?
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe water level, injuries, access problems, and anything responders should know." />
              </label>
              <button className="primary-button" type="submit" disabled={!location || needs.length === 0}>
                Send help request
              </button>
            </form>

            <aside className="resident-context">
              <section>
                <p className="eyebrow">LOCAL SIGNALS</p>
                <h2>Current conditions</h2>
                {weather ? (
                  <div className="condition-row">
                    <CloudRain size={20} />
                    <p><strong>{weather.temperature}°C</strong><span>{weather.precipitation} mm precipitation · {weather.windSpeed} km/h wind</span></p>
                  </div>
                ) : (
                  <p className="empty-state">Select a location to load current weather. Official alert feeds remain distinct from community reports.</p>
                )}
              </section>
              <section>
                <p className="eyebrow">NEARBY SUPPORT</p>
                <h2>Verified availability</h2>
                <div className="availability-row"><Navigation size={18} /><span>Volunteers</span><strong>{nearbyVolunteers.length}</strong></div>
                <div className="availability-row"><MapPin size={18} /><span>Shelter options</span><strong>{nearbyShelters.length}</strong></div>
                <p className="empty-state">Only coordinator-verified, currently available offers are shown.</p>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
