"use client"

import { useSession, signIn } from "next-auth/react"
import { useState } from "react"

type Status = "GOING" | "INTERESTED" | "NOT_GOING" | null

export function RsvpWidget({
  eventId,
  initialStatus,
  initialGoingCount,
}: {
  eventId: string
  initialStatus: Status
  initialGoingCount: number
}) {
  const { data: session, status } = useSession()
  const [current, setCurrent] = useState<Status>(initialStatus)
  const [goingCount, setGoingCount] = useState(initialGoingCount)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const loadingSession = status === "loading"

  async function update(status: Exclude<Status, null>) {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update RSVP")
      const wasGoing = current === "GOING"
      const nowGoing = status === "GOING"
      setGoingCount((c) => c + (nowGoing ? 1 : 0) - (wasGoing ? 1 : 0))
      setCurrent(status)
      setMsg("Saved")
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error saving RSVP")
    } finally {
      setSaving(false)
    }
  }

  if (loadingSession) return <div className="text-sm text-gray-600">Loading...</div>

  if (!session) {
    return (
      <div className="space-y-2 rounded border bg-white p-3 text-sm">
        <div className="font-semibold">RSVP to this event</div>
        <div className="text-gray-600">Sign in to set your RSVP.</div>
        <button
          onClick={() => signIn("google")}
          className="rounded bg-black px-3 py-2 text-white"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  const buttonClass = (s: Exclude<Status, null>) =>
    `rounded border px-3 py-2 text-sm ${
      current === s ? "bg-black text-white" : "bg-white hover:bg-gray-100"
    }`

  return (
    <div className="space-y-2 rounded border bg-white p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">RSVP</div>
        <div className="text-gray-600">Going: {goingCount}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={saving} onClick={() => update("GOING")} className={buttonClass("GOING")}>
          Going
        </button>
        <button disabled={saving} onClick={() => update("INTERESTED")} className={buttonClass("INTERESTED")}>
          Interested
        </button>
        <button disabled={saving} onClick={() => update("NOT_GOING")} className={buttonClass("NOT_GOING")}>
          Not going
        </button>
      </div>
      {msg && <div className="text-gray-600">{msg}</div>}
    </div>
  )
}
