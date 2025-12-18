'use client'

import { useEffect, useRef } from 'react'

interface GoogleMapProps {
  center: {
    lat: number
    lng: number
  }
  zoom?: number
  className?: string
}

export function GoogleMap({ center, zoom = 15, className = 'w-full h-64 rounded-lg' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return

    // Initialize map
    const mapOptions = {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    }

    const map = new (window as any).google.maps.Map(mapRef.current, mapOptions)
    mapInstanceRef.current = map

    // Add marker
    const marker = new (window as any).google.maps.Marker({
      position: center,
      map,
      title: 'Selected Location'
    })
    markerRef.current = marker

    return () => {
      // Cleanup marker
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
    }
  }, [])

  // Update map center and marker when center prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    mapInstanceRef.current.setCenter(center)

    if (markerRef.current) {
      markerRef.current.setPosition(center)
    }
  }, [center])

  return <div ref={mapRef} className={className} />
}
