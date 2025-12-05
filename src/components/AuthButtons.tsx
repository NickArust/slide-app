"use client"

import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"

export default function AuthButtons() {
  const { data: session, status } = useSession()
  const loading = status === "loading"
  const user = session?.user

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  if (!user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-100"
      >
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/profile" className="text-gray-700 hover:text-black">
        {user.name ?? user.email ?? "Profile"}
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border px-3 py-2 hover:bg-gray-100"
      >
        Sign out
      </button>
    </div>
  )
}
