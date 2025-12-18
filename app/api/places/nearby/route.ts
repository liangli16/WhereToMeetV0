import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export interface Place {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 })
    }

    const response = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: 2000, // 2km radius
        type: 'restaurant',
        key: process.env.GOOGLE_MAPS_API_KEY!
      }
    })

    const places: Place[] = response.data.results
      .filter(place => place.place_id && place.name && place.vicinity && place.geometry?.location) // Filter out incomplete results
      .map(place => ({
        id: place.place_id!,
        name: place.name!,
        address: place.vicinity!,
        rating: place.rating || 0,
        priceLevel: place.price_level || 0,
        location: {
          lat: place.geometry!.location.lat,
          lng: place.geometry!.location.lng
        },
        photoUrl: place.photos?.[0] ?
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
          : undefined
      }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
