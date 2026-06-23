import { useEffect, useState } from 'react'

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
    )
  }, [])

  return location
}
