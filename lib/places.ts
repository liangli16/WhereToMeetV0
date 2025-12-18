// Keep only the client-side utilities
// Server-side places API is now handled by /api/places/nearby route

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

export function calculateMidpoint(loc1: {lat: number, lng: number}, loc2: {lat: number, lng: number}) {
  return {
    lat: (loc1.lat + loc2.lat) / 2,
    lng: (loc1.lng + loc2.lng) / 2
  }
}
