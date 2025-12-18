'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LocationSetup } from '@/components/meeting/LocationSetup'
import { MeetingPlaces } from '@/components/meeting/MeetingPlaces'
import { AuthButton } from '@/components/auth/AuthButton'
import { toast } from 'sonner'

export default function MeetingPage() {
  const params = useParams()
  const meetingId = params.id as string
  const [meeting, setMeeting] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const initializePage = async () => {
      // First, check authentication status
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      setAuthChecked(true)

      // Always try to fetch meeting (for both authenticated and anonymous users)
      const { data: meeting, error } = await supabase
        .from('WhereToMeet-meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (error) {
        console.error('Error fetching meeting:', error)
        if (error.code === 'PGRST116') {
          setMeeting(null) // Meeting not found
        } else {
          // For other errors (like RLS blocking anonymous access), meeting stays null
          setMeeting(null)
        }
      } else {
        setMeeting(meeting)
        // Set anonymous flag if user is not authenticated
        if (!currentUser) {
          setIsAnonymous(true)
        }
      }

      setLoading(false)
    }

    initializePage()
  }, [meetingId, supabase])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!meeting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Meeting Not Found</h2>
          <p className="text-gray-600">This meeting link is invalid or has been deleted.</p>
        </div>
      </div>
    )
  }

  const isCreator = user && user.id === meeting.creator_id
  const hasBothLocations = meeting.creator_location && meeting.invitee_location

  return (
    <div className="container mx-auto py-8">
      {/* Anonymous indicator */}
      {isAnonymous && (
        <div className="mb-4 text-right">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 px-3 py-1 rounded-full">
            <span>Using anonymously</span>
            <AuthButton />
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">
        {isCreator ? 'Your Meeting' : 'Join Meeting'}
        {isAnonymous && ' (Anonymous)'}
      </h1>

      {/* Show creator location */}
      {meeting.creator_location && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Meeting Creator Location:</h3>
          <p className="text-gray-600">{meeting.creator_location?.displayName || meeting.creator_location?.address || 'Location set'}</p>
        </div>
      )}

      {/* Location setup for invitees */}
      {!isCreator && !meeting.invitee_location && (
        <LocationSetup
          user={user}
          meetingId={meetingId}
          isAnonymous={isAnonymous}
          onLocationSet={(location) => {
            setMeeting({...meeting, invitee_location: location})
          }}
        />
      )}

      {/* Show invitee location */}
      {meeting.invitee_location && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">Your Location:</h3>
          <p className="text-gray-600">{meeting.invitee_location?.displayName || meeting.invitee_location?.address || 'Location set'}</p>
        </div>
      )}

      {/* Places when both locations set */}
      {hasBothLocations && (
        <MeetingPlaces
          meeting={meeting}
          isAnonymous={isAnonymous}
          onPlaceSelected={(place) => {
            if (isAnonymous) {
              toast.error('Please sign in to schedule calendar events')
              return
            }
            console.log('Selected place:', place)
          }}
        />
      )}
    </div>
  )
}
