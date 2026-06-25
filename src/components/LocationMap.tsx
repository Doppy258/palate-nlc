import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MARKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/'

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: MARKER_CDN + 'marker-icon-2x.png',
  iconUrl: MARKER_CDN + 'marker-icon.png',
  shadowUrl: MARKER_CDN + 'marker-shadow.png',
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#2563eb;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export function LocationMap({
  lat,
  lon,
  userLocation,
  className = '',
  interactive = true,
  zoom = 15,
}: {
  lat: number
  lon: number
  userLocation?: { lat: number; lon: number } | null
  className?: string
  interactive?: boolean
  zoom?: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom,
      zoomControl: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      dragging: interactive,
      keyboard: interactive,
      attributionControl: interactive,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    L.marker([lat, lon]).addTo(map)

    if (userLocation) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon }).addTo(map)
    }

    requestAnimationFrame(() => map.invalidateSize())
    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [lat, lon, zoom])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !userLocation) return
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon])
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon }).addTo(map)
    }
  }, [userLocation])

  return <div ref={mapRef} className={className} />
}
