/* oxlint-disable react/only-export-components -- Provider and its required hook share one typed context. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createScenario } from '../data/scenario'
import type {
  AgentAssessment,
  CityProfile,
  Decision,
  Incident,
  Resource,
  WeatherSnapshot,
} from '../types'

type Stage = 'review' | 'verified' | 'planned' | 'approved' | 'published'

interface OperationsState {
  configured: boolean
  operatorName: string
  city: CityProfile | null
  stagingLocations: CityProfile[]
  hazard: string
  sourceRequestId: string
  stage: Stage
  decisions: Decision[]
  weather: WeatherSnapshot | null
  weatherLoading: boolean
  assessment: AgentAssessment | null
  assessmentLoading: boolean
  selectedIncident: Incident | null
  incidents: Incident[]
  resources: Resource[]
  configureOperation: (
    operatorName: string,
    city: CityProfile,
    stagingLocations: CityProfile[],
    reports: string[],
    sourceRequestId?: string,
  ) => void
  resetOperation: () => void
  verifyIncident: () => void
  approvePlan: () => void
  authorizeAlert: () => void
  overridePriority: (reason: string) => void
  loadWeather: () => Promise<void>
  refreshAssessment: () => Promise<void>
}

const OperationsContext = createContext<OperationsState | null>(null)

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(false)
  const [operatorName, setOperatorName] = useState('')
  const [city, setCity] = useState<CityProfile | null>(null)
  const [stagingLocations, setStagingLocations] = useState<CityProfile[]>([])
  const [hazard, setHazard] = useState('')
  const [sourceRequestId, setSourceRequestId] = useState('')
  const [stage, setStage] = useState<Stage>('review')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [assessment, setAssessment] = useState<AgentAssessment | null>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const selectedIncident = incidents[0] ?? null

  const nowLabel = useCallback(
    () =>
      new Intl.DateTimeFormat('en-CA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: weather?.timezone ?? city?.timezone ?? 'UTC',
      }).format(new Date()),
    [city?.timezone, weather?.timezone],
  )

  const appendDecision = useCallback(
    (decision: Omit<Decision, 'id' | 'time'>) => {
      setDecisions((current) => [
        ...current,
        {
          ...decision,
          id: `d-${current.length + 1}`,
          time: nowLabel(),
        },
      ])
    },
    [nowLabel],
  )

  const configureOperation = useCallback(
    (
      nextOperatorName: string,
      nextCity: CityProfile,
      nextStagingLocations: CityProfile[],
      reports: string[],
      nextSourceRequestId = '',
    ) => {
      const scenario = createScenario(nextCity, reports)
      setOperatorName(nextOperatorName.trim())
      setCity(nextCity)
      setStagingLocations(nextStagingLocations)
      setHazard(scenario.hazard)
      setSourceRequestId(nextSourceRequestId)
      setIncidents(scenario.incidents)
      setResources(scenario.resources)
      setDecisions(scenario.decisions)
      setWeather(null)
      setAssessment(null)
      setStage('review')
      setConfigured(true)
    },
    [],
  )

  const resetOperation = useCallback(() => {
    setConfigured(false)
    setCity(null)
    setStagingLocations([])
    setIncidents([])
    setSourceRequestId('')
    setResources([])
    setDecisions([])
    setWeather(null)
    setAssessment(null)
    setStage('review')
  }, [])

  const verifyIncident = useCallback(() => {
    if (!selectedIncident) return
    setStage((current) => (current === 'review' ? 'verified' : current))
    appendDecision({
      actor: `${operatorName} · Duty officer`,
      action: `Verified incident ${selectedIncident.shortId}`,
      detail:
        'Accepted corroborated reports for response planning. Unsupported claims remain explicitly unverified.',
      type: 'human',
    })
  }, [appendDecision, operatorName, selectedIncident])

  const approvePlan = useCallback(() => {
    if (!selectedIncident) return
    setStage('approved')
    appendDecision({
      actor: `${operatorName} · Duty officer`,
      action: 'Approved coordinated response',
      detail: `Authorized ${resources.length} required capabilities for assignment from the local inventory.`,
      type: 'human',
    })
  }, [appendDecision, operatorName, resources.length, selectedIncident])

  const authorizeAlert = useCallback(() => {
    if (!selectedIncident) return
    setStage('published')
    appendDecision({
      actor: `${operatorName} · Authorized operator`,
      action: 'Approved public-warning content',
      detail: `Approved warning content for ${selectedIncident.location}. Delivery requires a connected municipal notification provider.`,
      type: 'human',
    })
  }, [appendDecision, operatorName, selectedIncident])

  const overridePriority = useCallback(
    (reason: string) => {
      appendDecision({
        actor: `${operatorName} · Duty officer`,
        action: 'Reviewed recommended priority',
        detail: reason,
        type: 'human',
      })
    },
    [appendDecision, operatorName],
  )

  const loadWeather = useCallback(async () => {
    if (!city) return
    setWeatherLoading(true)
    try {
      const parameters = new URLSearchParams({
        lat: String(city.coordinate.lat),
        lng: String(city.coordinate.lng),
      })
      const response = await fetch(`/api/weather?${parameters}`)
      if (!response.ok) throw new Error('Weather unavailable')
      setWeather(await response.json())
    } catch {
      setWeather(null)
    } finally {
      setWeatherLoading(false)
    }
  }, [city])

  const refreshAssessment = useCallback(async () => {
    if (!selectedIncident) return
    setAssessmentLoading(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident: selectedIncident.title,
          reports: selectedIncident.reports.map((report) => report.text),
        }),
      })
      if (!response.ok) throw new Error('Assessment unavailable')
      setAssessment(await response.json())
    } catch {
      setAssessment(null)
    } finally {
      setAssessmentLoading(false)
    }
  }, [selectedIncident])

  const value = useMemo(
    () => ({
      configured,
      operatorName,
      city,
      stagingLocations,
      hazard,
      sourceRequestId,
      stage,
      decisions,
      weather,
      weatherLoading,
      assessment,
      assessmentLoading,
      selectedIncident,
      incidents,
      resources,
      configureOperation,
      resetOperation,
      verifyIncident,
      approvePlan,
      authorizeAlert,
      overridePriority,
      loadWeather,
      refreshAssessment,
    }),
    [
      configured,
      operatorName,
      city,
      stagingLocations,
      hazard,
      sourceRequestId,
      stage,
      decisions,
      weather,
      weatherLoading,
      assessment,
      assessmentLoading,
      selectedIncident,
      incidents,
      resources,
      configureOperation,
      resetOperation,
      verifyIncident,
      approvePlan,
      authorizeAlert,
      overridePriority,
      loadWeather,
      refreshAssessment,
    ],
  )

  return (
    <OperationsContext.Provider value={value}>
      {children}
    </OperationsContext.Provider>
  )
}

export function useOperations() {
  const value = useContext(OperationsContext)
  if (!value) {
    throw new Error('useOperations must be used within OperationsProvider')
  }
  return value
}
