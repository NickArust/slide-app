import "./globals.css"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Slide",
  description: "Local events near you",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
            <Link href="/" className="text-lg font-semibold">
              Slide
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create event
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl p-4">{children}</main>
      </body>
    </html>
  )
}
