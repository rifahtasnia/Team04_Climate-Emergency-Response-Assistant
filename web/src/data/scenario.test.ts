import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import type { CityProfile } from '../types'
import { createScenario } from './scenario'

const location: CityProfile = {
  id: 'test-place',
  name: 'Test City',
  region: 'Test Region',
  country: 'Test Country',
  displayName: 'Riverside District, Test City, Test Country',
  coordinate: { lat: 12.345, lng: 67.89 },
  timezone: 'UTC',
}

const reports = [
  'Floodwater is rising around a residential building.',
  'Water has reached the entrance and three residents are trapped upstairs.',
  'A wheelchair user needs help because the elevator is offline.',
  'The south road is closed by standing water.',
]

describe('input-driven operational scenario', () => {
  const scenario = createScenario(location, reports)
  const incident = scenario.incidents[0]

  it('uses supplied location and coordinates', () => {
    expect(incident.location).toBe(location.displayName)
    expect(incident.coordinate).toEqual(location.coordinate)
  })

  it('derives priority and confidence separately from submitted reports', () => {
    expect(incident.severity).toBe('critical')
    expect(incident.confidence).toBeGreaterThan(0)
    expect(incident.confidence).toBeLessThanOrEqual(100)
  })

  it('corroborates matching signals and preserves unique claims as unverified', () => {
    expect(
      incident.reports.some((report) => report.verification === 'corroborated'),
    ).toBe(true)
    expect(
      incident.reports.some((report) => report.verification === 'unverified'),
    ).toBe(true)
  })

  it('recommends capabilities without inventing local unit names', () => {
    expect(
      scenario.resources.some((resource) => resource.name === 'Water rescue capability'),
    ).toBe(true)
    expect(
      scenario.resources.some(
        (resource) => resource.name === 'Accessible evacuation capability',
      ),
    ).toBe(true)
    expect(scenario.resources.every((resource) => resource.status === 'Recommended')).toBe(
      true,
    )
  })

  it('reads every supplied Group 4 dataset family from generated analysis', async () => {
    const summary = JSON.parse(
      await readFile(
        new URL('../../../data/processed/dataset-summary.json', import.meta.url),
        'utf8',
      ),
    )
    expect(summary.natural_disasters_from_social_media.records).toBe(169109)
    expect(summary.toronto_current_and_future_climate.columns).toBe(58)
    expect(summary.transformto_resident_survey.responses).toBe(1023)
    expect(summary.montreal_ghg_inventory.sectors).toBe(5)
    expect(summary.african_climate_indicators.countries).toBe(54)
  })
})
