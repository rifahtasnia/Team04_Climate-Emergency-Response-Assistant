import type { Coordinate } from '../types'

export function distanceKm(a: Coordinate, b: Coordinate) {
  const radians = (degrees: number) => degrees * (Math.PI / 180)
  const earthRadiusKm = 6371
  const latitudeDelta = radians(b.lat - a.lat)
  const longitudeDelta = radians(b.lng - a.lng)
  const firstLatitude = radians(a.lat)
  const secondLatitude = radians(b.lat)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
