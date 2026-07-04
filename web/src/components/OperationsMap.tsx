import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useOperations } from '../state/OperationsContext'
import type { Coordinate, RouteSnapshot } from '../types'

type Layer = 'incidents' | 'resources' | 'route'

function MapFocus({ coordinate }: { coordinate?: Coordinate }) {
  const map = useMap()
  useEffect(() => {
    if (coordinate) {
      map.flyTo([coordinate.lat, coordinate.lng], 14, { duration: 0.6 })
    }
  }, [coordinate, map])
  return null
}

const markerIcon = (tone: string, label: string) =>
  L.divIcon({
    className: 'aegis-map-marker-wrap',
    html: `<span class="aegis-map-marker ${tone}" aria-label="${label}"><span></span></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

export function OperationsMap({
  focus,
  route = false,
  compact = false,
  onRouteLoaded,
}: {
  focus?: Coordinate
  route?: boolean
  compact?: boolean
  onRouteLoaded?: (route: RouteSnapshot) => void
}) {
  const { city, incidents, resources, selectedIncident, stagingLocations } =
    useOperations()
  const [activeLayers, setActiveLayers] = useState<Layer[]>([
    'incidents',
    'resources',
    ...(route ? (['route'] as Layer[]) : []),
  ])
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])

  useEffect(() => {
    const origin = stagingLocations[0]?.coordinate
    const destination = selectedIncident?.coordinate
    if (!route || !origin || !destination) return
    const fallback: [number, number][] = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ]
    const parameters = new URLSearchParams({
      originLat: String(origin.lat),
      originLng: String(origin.lng),
      destinationLat: String(destination.lat),
      destinationLng: String(destination.lng),
    })
    fetch(`/api/route?${parameters}`)
      .then((response) => {
        if (!response.ok) throw new Error('Route unavailable')
        return response.json()
      })
      .then((data: RouteSnapshot) => {
        if (Array.isArray(data.coordinates) && data.coordinates.length > 1) {
          setRoutePoints(
            data.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
          )
          onRouteLoaded?.(data)
        }
      })
      .catch(() => setRoutePoints(fallback))
  }, [onRouteLoaded, route, selectedIncident, stagingLocations])

  const centre = useMemo(
    () =>
      [
        focus?.lat ?? city?.coordinate.lat ?? 0,
        focus?.lng ?? city?.coordinate.lng ?? 0,
      ] as [number, number],
    [city, focus],
  )

  const toggleLayer = (layer: Layer) =>
    setActiveLayers((current) =>
      current.includes(layer)
        ? current.filter((candidate) => candidate !== layer)
        : [...current, layer],
    )

  return (
    <div className={`map-frame ${compact ? 'map-compact' : ''}`}>
      <MapContainer center={centre} zoom={12} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus coordinate={focus ?? city?.coordinate} />
        {selectedIncident && (
          <Circle
            center={[
              selectedIncident.coordinate.lat,
              selectedIncident.coordinate.lng,
            ]}
            radius={580}
            pathOptions={{
              color: '#ef6a5b',
              fillColor: '#ef6a5b',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '5 6',
            }}
          />
        )}
        {activeLayers.includes('incidents') &&
          incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.coordinate.lat, incident.coordinate.lng]}
              icon={markerIcon(
                incident.severity,
                `${incident.severity} incident: ${incident.title}`,
              )}
            >
              <Popup>
                <strong>{incident.shortId}</strong>
                <span>{incident.title}</span>
              </Popup>
            </Marker>
          ))}
        {activeLayers.includes('resources') &&
          resources.filter((resource) => resource.coordinate).map((resource) => (
            <Marker
              key={resource.id}
              position={[resource.coordinate!.lat, resource.coordinate!.lng]}
              icon={markerIcon('resource', resource.name)}
            >
              <Popup>
                <strong>{resource.name}</strong>
                <span>{resource.detail}</span>
              </Popup>
            </Marker>
          ))}
        {activeLayers.includes('resources') &&
          stagingLocations.map((stagingLocation, index) => (
            <Marker
              key={stagingLocation.id}
              position={[
                stagingLocation.coordinate.lat,
                stagingLocation.coordinate.lng,
              ]}
              icon={markerIcon('resource', `Response staging point ${index + 1}`)}
            >
              <Popup>
                <strong>{index === 0 ? 'Primary staging point' : `Staging point ${index + 1}`}</strong>
                <span>{stagingLocation.displayName}</span>
              </Popup>
            </Marker>
          ))}
        {route && activeLayers.includes('route') && routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#4b91ff', weight: 5, opacity: 0.9 }}
          />
        )}
      </MapContainer>
      <div className="map-layer-control" aria-label="Map layers">
        <span>Layers</span>
        <button
          type="button"
          className={activeLayers.includes('incidents') ? 'selected' : ''}
          onClick={() => toggleLayer('incidents')}
        >
          Incidents
        </button>
        <button
          type="button"
          className={activeLayers.includes('resources') ? 'selected' : ''}
          onClick={() => toggleLayer('resources')}
        >
          Resources
        </button>
        {route && (
          <button
            type="button"
            className={activeLayers.includes('route') ? 'selected' : ''}
            onClick={() => toggleLayer('route')}
          >
            Route
          </button>
        )}
      </div>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="legend-dot critical" /> Critical</span>
        <span><i className="legend-dot high" /> High</span>
        <span><i className="legend-dot resource" /> Resource</span>
      </div>
    </div>
  )
}
