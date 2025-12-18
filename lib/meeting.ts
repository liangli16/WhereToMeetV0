import { createClient } from './supabase/client'

export async function createMeeting(creatorId: string, location: any) { // Change from string to any
  const supabase = createClient()

  const { data, error } = await supabase
    .from('WhereToMeet-meetings')
    .insert({
      creator_id: creatorId,
      creator_location: location, // Store the full location object
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export function generateMeetingLink(meetingId: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/meet/${meetingId}`
}
