export type Severity = 'critical' | 'high' | 'moderate' | 'low'
export type Verification = 'corroborated' | 'unverified' | 'conflicting'

export interface Coordinate {
  lat: number
  lng: number
}

export interface CityProfile {
  id: string
  name: string
  region: string
  country: string
  displayName: string
  coordinate: Coordinate
  timezone: string
}

export interface Report {
  id: string
  time: string
  source: 'Resident report' | 'Field unit' | 'Transit control' | 'Public safety'
  text: string
  label: string
  verification: Verification
}

export interface Incident {
  id: string
  shortId: string
  title: string
  location: string
  coordinate: Coordinate
  severity: Severity
  confidence: number
  reportCount: number
  peopleAtRisk: number
  status: 'Review required' | 'Monitoring' | 'Responding'
  updated: string
  summary: string
  reports: Report[]
}

export interface Resource {
  id: string
  name: string
  type: string
  status: 'Available' | 'Assigned' | 'Limited' | 'Recommended'
  eta: number
  coordinate?: Coordinate
  detail: string
}

export interface Decision {
  id: string
  time: string
  actor: string
  action: string
  detail: string
  type: 'ai' | 'human' | 'system'
}

export interface WeatherSnapshot {
  temperature: number
  precipitation: number
  windSpeed: number
  observedAt: string
  timezone: string
  source: 'Open-Meteo' | 'Local forecast'
}

export interface RouteSnapshot {
  coordinates: [number, number][]
  duration: number
  distance: number
  source: 'OSRM' | 'Local route plan'
}

export interface DatasetSummary {
  natural_disasters_from_social_media: {
    records: number
    relevant: number
    flood_reports: number
    top_labels: [string, number][]
  }
  toronto_current_and_future_climate: {
    rows: number
    columns: number
    baseline_maximum_one_day_precipitation_mm: number
    future_maximum_one_day_precipitation_mm: number
    future_days_above_35c: number
  }
  transformto_resident_survey: {
    responses: number
    fields: number
    equitable_forest_support: number
    climate_lens_support: number
  }
  montreal_ghg_inventory: {
    sectors: number
    latest_year: number
    latest_total_tco2e: number
  }
  african_climate_indicators: {
    countries: number
    first_year: number
    last_year: number
  }
}

export type AidCategory =
  | 'Urgent rescue'
  | 'Medical aid'
  | 'Transportation'
  | 'Food and water'
  | 'Accommodation'
  | 'Power support'

export interface HelpRequest {
  id: string
  requesterName: string
  location: CityProfile
  needs: AidCategory[]
  vulnerabilities: string[]
  details: string
  createdAt: string
  status: 'Submitted' | 'Under review' | 'Matched' | 'Completed'
}

export interface VolunteerOffer {
  id: string
  volunteerName: string
  location: CityProfile
  skills: AidCategory[]
  travelRadiusKm: number
  available: boolean
  verified: boolean
}

export interface ShelterOffer {
  id: string
  providerName: string
  location: CityProfile
  spaces: number
  accessible: boolean
  acceptsPets: boolean
  generator: boolean
  available: boolean
  verified: boolean
}

export interface AgentAssessment {
  summary: string
  needs: string[]
  hazards: string[]
  recommendedAction: string
  confidence: number
  source: 'Gemini 3.5 Flash' | 'Rules engine'
}
