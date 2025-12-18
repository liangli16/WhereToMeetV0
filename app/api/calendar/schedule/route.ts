import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const { userId, place } = await request.json()

    const supabase = await createClient()

    // Get user's session to access Google tokens
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Set up Google Calendar client
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Create the event
    const meetingTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    const event = {
      summary: `Meeting at ${place.name}`,
      location: place.address,
      description: `Meeting scheduled via WhereToMeet\n\nPlace: ${place.name}\nAddress: ${place.address}\nRating: ${place.rating} stars`,
      start: {
        dateTime: meetingTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(meetingTime.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: true,
      },
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    // Update meeting in database
    const { error: updateError } = await supabase
      .from('WhereToMeet-meetings')
      .update({
        selected_place: place,
        status: 'scheduled',
        calendar_event_id: response.data.id
      })
      .eq('creator_id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    })

  } catch (error) {
    console.error('Calendar scheduling error:', error)
    return NextResponse.json({
      error: 'Failed to schedule meeting',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
