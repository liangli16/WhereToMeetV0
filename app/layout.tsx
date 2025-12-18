import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhereToMeet",
  description: "Find the perfect meeting spot between you and your friend",
};

async function ensureProfile(user: any) {
  if (!user) return

  const supabase = await createClient()

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('WhereToMeet-profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // Create profile if it doesn't exist
  if (!existingProfile) {
    const { error } = await supabase
      .from('WhereToMeet-profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url
      })

    if (error) {
      console.error('Error creating profile:', error)
    }
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Ensure profile exists for authenticated users
  if (user) {
    await ensureProfile(user);
  }

  return (
    <html lang="en">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}