'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { createMeeting, generateMeetingLink } from '@/lib/meeting'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { GoogleMap } from '@/components/ui/google-map'
import { toast } from 'sonner'

interface LocationSetupProps {
  user: any
  meetingId?: string
  isAnonymous?: boolean
  onLocationSet?: (location: any) => void
}

export function LocationSetup({ user, meetingId, isAnonymous, onLocationSet }: LocationSetupProps) {
  const [location, setLocation] = useState<any>('') // Change from string to any
  const [useGPS, setUseGPS] = useState(false)
  const [meetingLink, setMeetingLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [originalLocation, setOriginalLocation] = useState<any>(null) // Track original location

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({
            displayName: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            coordinates: { lat: latitude, lng: longitude }
          })
          setUseGPS(true)
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error("Could not get your current location.")
        }
      )
    }
  }

  const handleCreateMeeting = async () => {
    if (!location || (typeof location === 'object' && !location.coordinates)) {
      toast.error("Please set your location first.")
      return
    }

    setLoading(true)
    try {
      if (meetingId) {
        // Joining existing meeting - works for anonymous users now
        const supabase = createClient()
        const { data, error } = await supabase
          .from('WhereToMeet-meetings')
          .update({
            invitee_location: location, // Store the full location object
          })
          .eq('id', meetingId)
          .select()
          .single()

        if (error) throw error

        toast.success("Location set! You can now see meeting places.")
        onLocationSet?.(location)
      } else {
        // Creating new meeting (or updating existing one)
        const meeting = await createMeeting(user.id, location)
        const link = generateMeetingLink(meeting.id)
        setMeetingLink(link)
        setOriginalLocation(location) // Store original location
        toast.success(meetingLink ? "Address updated! New meeting link created." : "Meeting created! Share this link with someone to meet.")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(meetingId ? "Failed to join meeting." : "Failed to create meeting.")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if current location differs from original
  const hasLocationChanged = () => {
    if (!originalLocation || !location) return false
    if (typeof location === 'string' || typeof originalLocation === 'string') return false
    return (
      location.coordinates?.lat !== originalLocation.coordinates?.lat ||
      location.coordinates?.lng !== originalLocation.coordinates?.lng ||
      location.displayName !== originalLocation.displayName
    )
  }

  // Check if location is set with coordinates
  const hasValidLocation = location && typeof location === 'object' && location.coordinates

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{meetingId ? 'Join Meeting' : 'Set Your Location'}</CardTitle>
          <CardDescription>
            {meetingId
              ? 'Set your location to find meeting places between you and the other person'
              : 'Choose how you\'d like to set your location for the meeting'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={getCurrentLocation} variant="outline">
              Use GPS
            </Button>
            <PlacesAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Or enter address"
            />
          </div>

          {!meetingLink ? (
            <Button onClick={handleCreateMeeting} className="w-full" disabled={loading}>
              {loading
                ? (meetingId ? 'Joining...' : 'Creating...')
                : (meetingId ? 'Join Meeting' : 'Create Meeting Link')
              }
            </Button>
          ) : hasLocationChanged() ? (
            <Button onClick={handleCreateMeeting} className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Address'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Your meeting link:</p>
              <div className="flex gap-2">
                <Input value={meetingLink} readOnly />
                <Button onClick={() => navigator.clipboard.writeText(meetingLink)}>
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show map when location is set (persist after creating meeting link) */}
      {hasValidLocation && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium mb-2 text-center">
            {meetingLink ? 'Meeting Location' : 'Selected Location'}
          </h3>
          <GoogleMap center={location.coordinates} />
        </div>
      )}
    </div>
  )
}
