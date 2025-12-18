import { AuthButton } from '@/components/auth/AuthButton'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">WhereToMeet</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find the perfect meeting spot between you and your friend
          </p>
        </div>
        <AuthButton />
      </div>
    </div>
  )
}
