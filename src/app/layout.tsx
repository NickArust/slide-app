import "./globals.css"
import type { Metadata } from "next"
import Link from "next/link"
import { Providers } from "@/components/Providers"
import dynamic from "next/dynamic"

const AuthButtons = dynamic(() => import("@/components/AuthButtons"), { ssr: false })

export const metadata: Metadata = {
  title: "Slide",
  description: "Local events near you",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 p-4">
              <Link href="/" className="text-lg font-semibold">
                Slide
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/create"
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  Create event
                </Link>
                <AuthButtons />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-4xl p-4">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
