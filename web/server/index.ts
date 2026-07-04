import 'dotenv/config'
import dotenv from 'dotenv'
import express from 'express'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenAI } from '@google/genai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const app = express()
const port = Number(process.env.PORT ?? 8787)

app.use(express.json({ limit: '100kb' }))

const numericQuery = (value: unknown, min: number, max: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null
}

const geocodeCache = new Map<string, { expires: number; results: unknown[] }>()

app.get('/api/datasets', async (_request, response) => {
  try {
    const summaryPath = path.resolve(__dirname, '../../data/processed/dataset-summary.json')
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
    response.json(summary)
  } catch {
    response.status(503).json({ error: 'Dataset analysis is unavailable.' })
  }
})

app.get('/api/geocode', async (request, response) => {
  const query = String(request.query.q ?? '').trim().slice(0, 160)
  if (query.length < 2) {
    response.status(400).json({ error: 'Enter at least two characters.' })
    return
  }

  const cacheKey = query.toLocaleLowerCase()
  const cached = geocodeCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    response.json(cached.results)
    return
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '6')
    url.searchParams.set('dedupe', '1')
    const geocodeResponse = await fetch(url, {
      headers: {
        'User-Agent': 'AEGIS-Emergency-Coordination/1.0',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!geocodeResponse.ok) throw new Error('Geocoding request failed')
    const data = await geocodeResponse.json()
    const results = data
      .map((item: {
        place_id?: number
        lat?: string
        lon?: string
        display_name?: string
        address?: Record<string, string>
      }) => {
        const address = item.address ?? {}
        const name =
          address.city ??
          address.town ??
          address.village ??
          address.municipality ??
          address.county ??
          String(item.display_name ?? '').split(',')[0]
        return {
          id: String(item.place_id ?? `${item.lat}-${item.lon}`),
          name,
          region: address.state ?? address.region ?? address.county ?? '',
          country: address.country ?? '',
          displayName: item.display_name ?? name,
          coordinate: {
            lat: Number(item.lat),
            lng: Number(item.lon),
          },
          timezone: 'UTC',
        }
      })
      .filter(
        (item: { coordinate: { lat: number; lng: number } }) =>
          Number.isFinite(item.coordinate.lat) && Number.isFinite(item.coordinate.lng),
      )
    geocodeCache.set(cacheKey, {
      expires: Date.now() + 15 * 60_000,
      results,
    })
    response.json(results)
  } catch {
    response.status(502).json({ error: 'Location search is temporarily unavailable.' })
  }
})

app.get('/api/staging-sites', async (request, response) => {
  const latitude = numericQuery(request.query.lat, -90, 90)
  const longitude = numericQuery(request.query.lng, -180, 180)
  if (latitude === null || longitude === null) {
    response.status(400).json({ error: 'Valid incident coordinates are required.' })
    return
  }

  const query = `[out:json][timeout:12];
    (
      nwr(around:12000,${latitude},${longitude})["amenity"~"fire_station|police|hospital"];
    );
    out center tags 20;`

  try {
    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AEGIS-Emergency-Coordination/1.0',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(14_000),
    })
    if (!overpassResponse.ok) throw new Error('Public-safety site search failed')
    const data = await overpassResponse.json()
    const sites = data.elements
      .map(
        (element: {
          id: number
          lat?: number
          lon?: number
          center?: { lat?: number; lon?: number }
          tags?: Record<string, string>
        }) => {
          const lat = element.lat ?? element.center?.lat
          const lng = element.lon ?? element.center?.lon
          const amenity = element.tags?.amenity?.replace(/_/g, ' ') ?? 'public safety'
          return {
            id: `osm-${element.id}`,
            name: element.tags?.name ?? `${amenity} site`,
            region: 'Suggested public-safety site',
            country: 'Confirm availability before dispatch',
            displayName: element.tags?.name ?? `${amenity} site`,
            coordinate: { lat, lng },
            timezone: 'UTC',
          }
        },
      )
      .filter(
        (site: { coordinate: { lat?: number; lng?: number } }) =>
          Number.isFinite(site.coordinate.lat) && Number.isFinite(site.coordinate.lng),
      )
      .slice(0, 8)
    response.json(sites)
  } catch {
    response.status(502).json({ error: 'Nearby public-safety sites are unavailable.' })
  }
})

app.get('/api/weather', async (request, response) => {
  const latitude = numericQuery(request.query.lat, -90, 90)
  const longitude = numericQuery(request.query.lng, -180, 180)
  if (latitude === null || longitude === null) {
    response.status(400).json({ error: 'Valid latitude and longitude are required.' })
    return
  }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(latitude))
    url.searchParams.set('longitude', String(longitude))
    url.searchParams.set('current', 'temperature_2m,precipitation,wind_speed_10m')
    url.searchParams.set('timezone', 'auto')
    const weatherResponse = await fetch(url, { signal: AbortSignal.timeout(4500) })
    if (!weatherResponse.ok) throw new Error('Weather request failed')
    const data = await weatherResponse.json()
    response.json({
      temperature: Math.round(data.current.temperature_2m),
      precipitation: data.current.precipitation,
      windSpeed: Math.round(data.current.wind_speed_10m),
      observedAt: String(data.current.time).slice(11, 16),
      timezone: data.timezone,
      source: 'Open-Meteo',
    })
  } catch {
    response.status(502).json({ error: 'Current weather is temporarily unavailable.' })
  }
})

app.get('/api/route', async (request, response) => {
  const originLat = numericQuery(request.query.originLat, -90, 90)
  const originLng = numericQuery(request.query.originLng, -180, 180)
  const destinationLat = numericQuery(request.query.destinationLat, -90, 90)
  const destinationLng = numericQuery(request.query.destinationLng, -180, 180)
  if (
    originLat === null ||
    originLng === null ||
    destinationLat === null ||
    destinationLng === null
  ) {
    response.status(400).json({ error: 'Valid origin and destination are required.' })
    return
  }
  const origin = `${originLng},${originLat}`
  const destination = `${destinationLng},${destinationLat}`
  try {
    const routeResponse = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson&alternatives=true`,
      { signal: AbortSignal.timeout(5000) },
    )
    if (!routeResponse.ok) throw new Error('Routing request failed')
    const data = await routeResponse.json()
    response.json({
      coordinates: data.routes[0].geometry.coordinates,
      duration: Math.round(data.routes[0].duration / 60),
      distance: Number((data.routes[0].distance / 1000).toFixed(1)),
      source: 'OSRM',
    })
  } catch {
    const latitudeDistance = (destinationLat - originLat) * 111.32
    const longitudeDistance =
      (destinationLng - originLng) *
      111.32 *
      Math.cos(((originLat + destinationLat) / 2) * (Math.PI / 180))
    const distance = Math.max(
      0.1,
      Math.sqrt(latitudeDistance ** 2 + longitudeDistance ** 2),
    )
    response.json({
      coordinates: [
        [originLng, originLat],
        [destinationLng, destinationLat],
      ],
      duration: Math.max(1, Math.round((distance / 25) * 60)),
      distance: Number(distance.toFixed(1)),
      source: 'Local route plan',
    })
  }
})

app.post('/api/analyze', async (request, response) => {
  const key = process.env.GEMINI_API_KEY
  const incident = String(request.body?.incident ?? '').slice(0, 200)
  const reports = Array.isArray(request.body?.reports)
    ? request.body.reports.slice(0, 12).map((item: unknown) => String(item).slice(0, 800))
    : []

  const corpus = reports.join(' ').toLowerCase()
  const needs = [
    ...(/flood|water|rain|river/.test(corpus) ? ['Water rescue'] : []),
    ...(/fire|smoke|wildfire/.test(corpus) ? ['Evacuation coordination'] : []),
    ...(/wheelchair|mobility|accessible|elevator/.test(corpus)
      ? ['Accessible evacuation']
      : []),
    'Medical standby',
  ].slice(0, 4)
  const hazards = [
    ...(/flood|water|rain|river/.test(corpus) ? ['Flood conditions'] : []),
    ...(/fire|smoke|wildfire/.test(corpus) ? ['Fire conditions'] : []),
    ...(/closed|blocked|impassable/.test(corpus) ? ['Access disruption'] : []),
    ...(/outage|power/.test(corpus) ? ['Utility outage'] : []),
  ].slice(0, 4)
  const rulesAssessment = {
    summary: `${reports.length} submitted report${reports.length === 1 ? '' : 's'} were assessed for corroboration, access constraints, and immediate life-safety needs.`,
    needs: needs.length ? needs : ['Rapid field assessment', 'Medical standby'],
    hazards: hazards.length ? hazards : ['Conditions require field verification'],
    recommendedAction:
      'Verify corroborated facts, assign the required local capabilities, and keep unsupported claims marked as unverified.',
    confidence: Math.min(95, 52 + reports.length * 9),
    source: 'Rules engine',
  }

  if (!key) {
    response.json(rulesAssessment)
    return
  }

  try {
    const client = new GoogleGenAI({ apiKey: key })
    const result = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You support a municipal emergency coordinator. Analyze only the supplied reports. Never turn an unverified statement into a fact.

Incident: ${incident}
Reports:
${reports.map((report: string, index: number) => `${index + 1}. ${report}`).join('\n')}

Return concise JSON with: summary (string), needs (string array, max 4), hazards (string array, max 4), recommendedAction (string), confidence (integer 0-100).`,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            needs: { type: 'array', items: { type: 'string' } },
            hazards: { type: 'array', items: { type: 'string' } },
            recommendedAction: { type: 'string' },
            confidence: { type: 'integer', minimum: 0, maximum: 100 },
          },
          required: ['summary', 'needs', 'hazards', 'recommendedAction', 'confidence'],
        },
      },
    })
    const parsed = JSON.parse(result.text ?? '{}')
    response.json({ ...parsed, source: 'Gemini 3.5 Flash' })
  } catch (error) {
    console.error('Gemini analysis failed', error)
    response.json(rulesAssessment)
  }
})

const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get('/{*path}', (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, '127.0.0.1', () => {
  console.log(`AEGIS server listening on http://127.0.0.1:${port}`)
})
