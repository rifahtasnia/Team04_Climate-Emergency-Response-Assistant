import type {
  CityProfile,
  Decision,
  Incident,
  Report,
  Resource,
  Severity,
} from '../types'

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const classifyReport = (text: string) => {
  const lower = text.toLowerCase()
  if (/wheelchair|mobility|accessible|elevator/.test(lower)) return 'Accessibility need'
  if (/closed|closure|blocked|impassable|road/.test(lower)) return 'Access disruption'
  if (/trapped|stranded|rescue|evacuat/.test(lower)) return 'People at risk'
  if (/fire|smoke|wildfire/.test(lower)) return 'Fire conditions'
  if (/heat|temperature|cooling/.test(lower)) return 'Extreme heat'
  if (/flood|water|rain|river|creek/.test(lower)) return 'Flood conditions'
  return 'Situation report'
}

const reportSignals = (text: string) => {
  const lower = text.toLowerCase()
  return [
    ...(/flood|water|rain|river|creek/.test(lower) ? ['flood'] : []),
    ...(/fire|smoke|wildfire/.test(lower) ? ['fire'] : []),
    ...(/heat|temperature|cooling/.test(lower) ? ['heat'] : []),
    ...(/closed|closure|blocked|impassable|road/.test(lower) ? ['access'] : []),
    ...(/wheelchair|mobility|accessible|elevator/.test(lower)
      ? ['accessibility']
      : []),
    ...(/trapped|stranded|rescue|evacuat/.test(lower) ? ['people-at-risk'] : []),
  ]
}

const incidentDescriptor = (reports: string[]) => {
  const corpus = reports.join(' ').toLowerCase()
  if (/fire|smoke|wildfire/.test(corpus)) {
    return {
      title: 'Wildfire threat requires evacuation review',
      hazard: 'Wildfire',
      needs: ['Evacuation coordination', 'Medical standby', 'Public warning'],
    }
  }
  if (/heat|temperature|cooling/.test(corpus)) {
    return {
      title: 'Extreme heat reports require welfare response',
      hazard: 'Extreme heat',
      needs: ['Welfare checks', 'Accessible cooling', 'Medical standby'],
    }
  }
  if (/storm|wind|tornado|hurricane|cyclone/.test(corpus)) {
    return {
      title: 'Severe storm impacts require coordinated response',
      hazard: 'Severe storm',
      needs: ['Rapid assessment', 'Medical standby', 'Temporary reception'],
    }
  }
  if (/flood|water|rain|river|creek/.test(corpus)) {
    return {
      title: 'Flooding requires coordinated response',
      hazard: 'Flooding',
      needs: ['Water rescue', 'Accessible evacuation', 'Medical standby'],
    }
  }
  return {
    title: 'Climate emergency reports require verification',
    hazard: 'Climate emergency',
    needs: ['Rapid assessment', 'Medical standby', 'Public information'],
  }
}

const inferSeverity = (reports: string[]): Severity => {
  const corpus = reports.join(' ').toLowerCase()
  if (/trapped|life.threat|immediate danger|injur|missing|evacuat/.test(corpus)) {
    return 'critical'
  }
  if (/closed|blocked|rising|outage|smoke|extreme/.test(corpus)) return 'high'
  return 'moderate'
}

const inferPeopleAtRisk = (reports: string[]) => {
  const relevantNumbers = reports.flatMap((report) => {
    if (!/people|residents|person|famil|occupant|patient/i.test(report)) return []
    return [...report.matchAll(/\b(\d{1,3})\b/g)].map((match) => Number(match[1]))
  })
  return relevantNumbers.reduce((total, value) => total + value, 0)
}

const buildReports = (city: CityProfile, reportTexts: string[]): Report[] => {
  const labels = reportTexts.map(classifyReport)
  const signals = reportTexts.map(reportSignals)
  const signalCounts = new Map<string, number>()
  signals.flat().forEach((signal) =>
    signalCounts.set(signal, (signalCounts.get(signal) ?? 0) + 1),
  )
  return reportTexts.map((text, index) => ({
    id: `${slugify(city.id)}-report-${index + 1}`,
    time: new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: city.timezone,
    }).format(new Date(Date.now() - (reportTexts.length - index) * 120_000)),
    source: 'Resident report',
    text,
    label: labels[index],
    verification:
      signals[index].some((signal) => (signalCounts.get(signal) ?? 0) > 1)
        ? 'corroborated'
        : 'unverified',
  }))
}

const buildCapabilities = (
  city: CityProfile,
  reports: string[],
): Resource[] => {
  const corpus = reports.join(' ').toLowerCase()
  const capabilities = [
    ...(/flood|water|river|rain/.test(corpus)
      ? [{ name: 'Water rescue capability', type: 'Specialist rescue' }]
      : []),
    ...(/fire|smoke|wildfire/.test(corpus)
      ? [{ name: 'Fire evacuation capability', type: 'Specialist response' }]
      : []),
    { name: 'Emergency medical capability', type: 'Medical response' },
    ...(/wheelchair|mobility|accessible|elevator/.test(corpus)
      ? [{ name: 'Accessible evacuation capability', type: 'Accessible transport' }]
      : []),
    { name: 'Temporary reception capability', type: 'Community support' },
  ]

  return capabilities.map((capability, index) => ({
    id: `${slugify(city.id)}-capability-${index + 1}`,
    name: capability.name,
    type: capability.type,
    status: 'Recommended',
    eta: 0,
    detail: 'Required capability · assign from connected local inventory',
  }))
}

export function createScenario(city: CityProfile, reportTexts: string[]): {
  incidents: Incident[]
  resources: Resource[]
  decisions: Decision[]
  hazard: string
  needs: string[]
} {
  const normalizedReports = reportTexts.map((report) => report.trim()).filter(Boolean)
  const descriptor = incidentDescriptor(normalizedReports)
  const severity = inferSeverity(normalizedReports)
  const confidence = Math.min(95, 52 + normalizedReports.length * 9)
  const shortId = `${descriptor.hazard.slice(0, 2).toUpperCase()}-${String(
    Math.abs(slugify(city.displayName).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) %
      1000,
  ).padStart(3, '0')}`
  const incidentCoordinate = city.coordinate
  const reports = buildReports(city, normalizedReports)
  const incident: Incident = {
    id: `${slugify(city.id)}-${shortId.toLowerCase()}`,
    shortId,
    title: descriptor.title,
    location: city.displayName,
    coordinate: incidentCoordinate,
    severity,
    confidence,
    reportCount: reports.length,
    peopleAtRisk: inferPeopleAtRisk(normalizedReports),
    status: 'Review required',
    updated: reports.at(-1)?.time ?? '--:--',
    summary: `${reports.length} incoming report${reports.length === 1 ? '' : 's'} require corroboration and an authorized response decision.`,
    reports,
  }
  const resources = buildCapabilities(city, normalizedReports)
  const decisions: Decision[] = [
    {
      id: 'd-1',
      time: incident.updated,
      actor: 'Signal agent',
      action: `Created incident ${shortId}`,
      detail: `${reports.length} report${reports.length === 1 ? '' : 's'} associated with ${city.displayName}.`,
      type: 'ai',
    },
    {
      id: 'd-2',
      time: incident.updated,
      actor: 'Verification agent',
      action: `Calculated ${confidence}% evidence confidence`,
      detail: 'Confidence reflects report agreement and source count, not incident severity.',
      type: 'ai',
    },
    {
      id: 'd-3',
      time: incident.updated,
      actor: 'Priority agent',
      action: `Recommended ${severity} priority`,
      detail: 'Priority was derived from risk language in the submitted reports and requires human review.',
      type: 'ai',
    },
  ]

  return {
    incidents: [incident],
    resources,
    decisions,
    hazard: descriptor.hazard,
    needs: descriptor.needs,
  }
}
