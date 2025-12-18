'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

interface PlacesAutocompleteProps {
  value: any // Change from string to any to accept objects
  onChange: (value: any) => void // Change from string to any
  placeholder?: string
  className?: string
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inputRef.current || !(window as any).google) return

    const autocomplete = new (window as any).google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: [],
        fields: ['name', 'formatted_address', 'geometry']
      }
    )

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        // Store both display name and coordinates
        const locationData = {
          displayName: place.name || inputRef.current?.value || place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        }
        onChange(locationData)
      }
    })

    return () => {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.event) {
        (window as any).google.maps.event.clearInstanceListeners(autocomplete)
      }
    }
  }, [])

  // Display the displayName if available, otherwise the current input value
  const displayValue = value?.displayName || (typeof value === 'string' ? value : '')

  return (
    <Input
      ref={inputRef}
      value={displayValue}
      onChange={(e) => {
        // For manual typing, store as string initially
        if (typeof value !== 'object') {
          onChange(e.target.value)
        } else {
          // If we have an object, update the displayName
          onChange({ ...value, displayName: e.target.value })
        }
      }}
      placeholder={placeholder}
      className={className}
    />
  )
}
