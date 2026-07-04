import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, LocateFixed, Search } from 'lucide-react'
import { useOperations } from '../state/OperationsContext'
import { useResponseNetwork } from '../state/ResponseNetworkContext'
import type { CityProfile } from '../types'
import { distanceKm } from '../utils/geo'

export function LocationSearch({
  legend,
  placeholder,
  onSelect,
  suggestionOrigin,
  initialLocation,
}: {
  legend: string
  placeholder: string
  onSelect: (location: CityProfile | null) => void
  suggestionOrigin?: CityProfile | null
  initialLocation?: CityProfile | null
}) {
  const inputId = `location-${legend.toLowerCase().replace(/[^a-z]+/g, '-')}`
  const [query, setQuery] = useState(initialLocation?.displayName ?? '')
  const [results, setResults] = useState<CityProfile[]>([])
  const [selected, setSelected] = useState<CityProfile | null>(initialLocation ?? null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initialLocation) return
    setQuery(initialLocation.displayName)
    setSelected(initialLocation)
    setResults([initialLocation])
  }, [initialLocation])

  const search = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    setSelected(null)
    onSelect(null)
    setError('')
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Location search failed')
      setResults(data)
      if (!data.length) setError('No matching locations found. Add a region or country.')
    } catch (reason) {
      setResults([])
      setError(reason instanceof Error ? reason.message : 'Location search failed.')
    } finally {
      setSearching(false)
    }
  }

  const findNearbySites = async () => {
    if (!suggestionOrigin) return
    setSearching(true)
    setSelected(null)
    onSelect(null)
    setError('')
    try {
      const parameters = new URLSearchParams({
        lat: String(suggestionOrigin.coordinate.lat),
        lng: String(suggestionOrigin.coordinate.lng),
      })
      const response = await fetch(`/api/staging-sites?${parameters}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Site search failed')
      setResults(data)
      if (!data.length) {
        setError('No nearby public-safety sites were found. Search for a known depot or station.')
      }
    } catch (reason) {
      setResults([])
      setError(reason instanceof Error ? reason.message : 'Site search failed.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="location-search-row">
        <label className="sr-only" htmlFor={inputId}>{placeholder}</label>
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSelected(null)
            onSelect(null)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            void search()
          }}
          placeholder={placeholder}
          required
        />
        <button className="secondary-button" type="button" onClick={search}>
          <Search size={16} />
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>
      {suggestionOrigin && (
        <button
          className="staging-suggestion-button"
          type="button"
          onClick={findNearbySites}
        >
          <LocateFixed size={15} />
          I don’t know — find nearby public-safety sites
        </button>
      )}
      {suggestionOrigin === null && (
        <p className="field-help">
          Don’t know the staging point? Select the incident location first and
          AEGIS can find nearby public-safety sites.
        </p>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {results.length > 0 && (
        <div className="location-results" role="listbox" aria-label={`${legend} results`}>
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              role="option"
              aria-selected={selected?.id === result.id}
              className={selected?.id === result.id ? 'selected' : ''}
              onClick={() => {
                setSelected(result)
                onSelect(result)
              }}
            >
              <LocateFixed size={16} />
              <span>
                <strong>{result.displayName}</strong>
              </span>
              {selected?.id === result.id && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  )
}

function StagingCandidates({
  incidentLocation,
  onSelect,
}: {
  incidentLocation: CityProfile | null
  onSelect: (locations: CityProfile[]) => void
}) {
  const [sites, setSites] = useState<CityProfile[]>([])
  const [selected, setSelected] = useState<CityProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSites([])
    setSelected([])
    onSelect([])
    if (!incidentLocation) return

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const parameters = new URLSearchParams({
          lat: String(incidentLocation.coordinate.lat),
          lng: String(incidentLocation.coordinate.lng),
        })
        const response = await fetch(`/api/staging-sites?${parameters}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Site search failed')
        const ordered = [...data].sort(
          (a: CityProfile, b: CityProfile) =>
            distanceKm(incidentLocation.coordinate, a.coordinate) -
            distanceKm(incidentLocation.coordinate, b.coordinate),
        )
        setSites(ordered)
        if (ordered[0]) {
          setSelected([ordered[0]])
          onSelect([ordered[0]])
        } else {
          setError('No nearby public-safety sites were found.')
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Site search failed.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [incidentLocation, onSelect])

  return (
    <fieldset>
      <legend>Suggested response staging</legend>
      {!incidentLocation && (
        <p className="field-help">Select the incident location to find nearby public-safety sites automatically.</p>
      )}
      {loading && <p className="field-help">Finding nearby fire stations, police facilities, and hospitals…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {sites.length > 0 && (
        <>
          <p className="field-help">The nearest candidate is the primary route origin. Select additional sites for parallel staging; availability must still be confirmed.</p>
          <div className="location-results staging-results" role="listbox" aria-label="Suggested staging sites">
            {sites.map((site) => (
              <button
                key={site.id}
                type="button"
                role="option"
                aria-selected={selected.some((candidate) => candidate.id === site.id)}
                className={selected.some((candidate) => candidate.id === site.id) ? 'selected' : ''}
                onClick={() => {
                  const next = selected.some((candidate) => candidate.id === site.id)
                    ? selected.filter((candidate) => candidate.id !== site.id)
                    : [...selected, site]
                  setSelected(next)
                  onSelect(next)
                }}
              >
                <LocateFixed size={16} />
                <span>
                  <strong>{site.displayName}</strong>
                  <small>{distanceKm(incidentLocation!.coordinate, site.coordinate).toFixed(1)} km away · confirm availability</small>
                </span>
                {selected.some((candidate) => candidate.id === site.id) && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </fieldset>
  )
}

export function OperationsSetup({
  compact = false,
  onCancel,
}: {
  compact?: boolean
  onCancel?: () => void
}) {
  const { operatorName: currentOperator, configureOperation } = useOperations()
  const { helpRequests, updateRequestStatus } = useResponseNetwork()
  const [operatorName, setOperatorName] = useState(currentOperator)
  const [incidentLocation, setIncidentLocation] = useState<CityProfile | null>(null)
  const [stagingLocations, setStagingLocations] = useState<CityProfile[]>([])
  const [reportText, setReportText] = useState('')
  const [starting, setStarting] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState('')

  const startOperation = async (event: FormEvent) => {
    event.preventDefault()
    const reports = reportText
      .split('\n')
      .map((report) => report.trim())
      .filter(Boolean)
    if (
      !operatorName.trim() ||
      !incidentLocation ||
      stagingLocations.length === 0 ||
      reports.length === 0
    ) {
      return
    }
    setStarting(true)

    let location = incidentLocation
    try {
      const parameters = new URLSearchParams({
        lat: String(location.coordinate.lat),
        lng: String(location.coordinate.lng),
      })
      const response = await fetch(`/api/weather?${parameters}`)
      if (response.ok) {
        const weather = await response.json()
        location = { ...location, timezone: weather.timezone ?? location.timezone }
      }
    } catch {
      // The operation can start without current weather; the page will retry.
    }

    configureOperation(operatorName, location, stagingLocations, reports, selectedRequestId)
    if (selectedRequestId) updateRequestStatus(selectedRequestId, 'Under review')
    setStarting(false)
    onCancel?.()
  }

  return (
    <section className={`operations-setup ${compact ? 'setup-compact' : ''}`}>
      <div className="setup-intro">
        <p className="eyebrow">NEW OPERATION</p>
        <h1>Turn incoming reports into coordinated action.</h1>
        <p>
          Identify the operator, locate the incident and response origin, then
          add reports exactly as they were received. AEGIS builds the operating
          picture from those inputs.
        </p>
      </div>

      <form className="setup-form" onSubmit={startOperation}>
        {helpRequests.length > 0 && (
          <fieldset>
            <legend>Incoming help requests</legend>
            <div className="intake-request-list">
              {helpRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  className={selectedRequestId === request.id ? 'selected' : ''}
                  onClick={() => {
                    setSelectedRequestId(request.id)
                    setIncidentLocation(request.location)
                    setReportText(
                      [
                        request.details,
                        `${request.needs.join(', ')} requested.`,
                        request.vulnerabilities.length
                          ? `Priority factors: ${request.vulnerabilities.join(', ')}.`
                          : '',
                      ]
                        .filter(Boolean)
                        .join('\n'),
                    )
                  }}
                >
                  <span><strong>{request.needs.join(' · ')}</strong><small>{request.location.displayName}</small></span>
                  <em>{request.status}</em>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <label>
          Operator name
          <input
            value={operatorName}
            onChange={(event) => setOperatorName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            required
          />
        </label>

        <LocationSearch
          legend="Incident location"
          placeholder="Search exact incident address or landmark"
          onSelect={setIncidentLocation}
          initialLocation={incidentLocation}
        />

        <StagingCandidates
          incidentLocation={incidentLocation}
          onSelect={setStagingLocations}
        />

        <label>
          Incoming situation reports
          <textarea
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
            placeholder={'Paste one report per line.\nInclude observed conditions, people at risk, accessibility needs, and access constraints.'}
            required
          />
          <small>
            {reportText.split('\n').filter((report) => report.trim()).length} reports ready.
            Used for hazard, priority, confidence, capability, guidance, and audit analysis.
          </small>
        </label>

        <div className="setup-actions">
          {onCancel && (
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="primary-button"
            disabled={
              starting ||
              !operatorName.trim() ||
              !incidentLocation ||
              stagingLocations.length === 0 ||
              !reportText.trim()
            }
          >
            {starting ? 'Starting operation…' : 'Start operation'}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </section>
  )
}
