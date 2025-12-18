'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LocationSetup } from '@/components/meeting/LocationSetup'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
    }
    getUser()
  }, [supabase, router])

  if (!user) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to WhereToMeet</h1>
      <LocationSetup user={user} />
    </div>
  )
}
