'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Remove: import { findPlacesNearLocation, calculateMidpoint, Place } from '@/lib/places'
import { calculateMidpoint } from '@/lib/places'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

interface MeetingPlacesProps {
  meeting: any
  isAnonymous?: boolean
  onPlaceSelected: (place: Place) => void
}

interface Place {
  id: string
  name: string
  address: string
  rating: number
  priceLevel: number
  photoUrl?: string
  location: {
    lat: number
    lng: number
  }
}

export function MeetingPlaces({ meeting, onPlaceSelected }: MeetingPlacesProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState<string | null>(null)

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        // Parse coordinates from locations
        const creatorCoords = parseLocation(meeting.creator_location)
        const inviteeCoords = parseLocation(meeting.invitee_location)

        if (!creatorCoords || !inviteeCoords) return

        const midpoint = calculateMidpoint(creatorCoords, inviteeCoords)

        // Call the API route instead of the library directly
        const response = await fetch(`/api/places/nearby?lat=${midpoint.lat}&lng=${midpoint.lng}`)
        const data = await response.json()

        if (data.places) {
          setPlaces(data.places)
        } else {
          console.error('API error:', data.error)
          setPlaces([])
        }
      } catch (error) {
        console.error('Error loading places:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlaces()
  }, [meeting])

  const parseLocation = (locationData: any) => {
    if (typeof locationData === 'string') {
      // Handle coordinate string like "lat,lng"
      const [lat, lng] = locationData.split(',').map(Number)
      return { lat, lng }
    }
    // Handle new location object format
    if (locationData?.coordinates) {
      return locationData.coordinates
    }
    // Handle old geocoded address object
    return locationData?.coordinates || null
  }

  const handlePlaceSelection = async (place: Place) => {
    setScheduling(place.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please sign in to schedule a meeting.")
        return
      }

      const response = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          place: place
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule meeting')
      }

      toast.success("Meeting scheduled! Check your Google Calendar.")

      // Call the parent callback
      onPlaceSelected(place)
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      toast.error("Failed to schedule meeting. Please try again.")
    } finally {
      setScheduling(null)
    }
  }

  if (loading) return <div>Loading places...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose a Meeting Spot</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <Card key={place.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              {place.photoUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={place.photoUrl}
                    alt={place.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              )}
              <CardTitle className="text-lg">{place.name}</CardTitle>
              <CardDescription>{place.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Badge variant="secondary">★ {place.rating}</Badge>
                <span className="text-sm text-muted-foreground">
                  {'$'.repeat(place.priceLevel)}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePlaceSelection(place)}
                disabled={scheduling === place.id}
              >
                {scheduling === place.id ? 'Scheduling...' : 'Select This Place'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
