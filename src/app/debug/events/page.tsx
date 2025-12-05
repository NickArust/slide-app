"use client"

import { useEffect, useState } from "react"
import EventCard from "@/components/EventCard"

type Event = {
  id: string
  title: string
  category: string
  address: string
  startsAt: string
  endsAt: string
  createdAt: string
  creatorUsername?: string | null
  creatorName?: string | null
  creatorEmail?: string | null
  creatorId?: string
  isFriendHost?: boolean
}

export default function DebugEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/events/all", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load events")
      }
      setEvents(data.events ?? [])
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : "Unknown error loading events"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const now = Date.now()
  const upcoming = [...events]
    .filter((ev) => new Date(ev.endsAt).getTime() >= now)
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
  const past = [...events]
    .filter((ev) => new Date(ev.endsAt).getTime() < now)
    .sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">All events (debug)</h1>
          <p className="text-sm text-gray-600">
            Lists every event in the database. No distance or time filtering.
          </p>
        </div>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-lg font-semibold">{events.length}</span>{" "}
            total
          </div>
          <div>
            <span className="text-lg font-semibold">{upcoming.length}</span>{" "}
            upcoming/active
          </div>
          <div>
            <span className="text-lg font-semibold">{past.length}</span> past
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Developer-only view. Remove or protect before shipping.
        </div>
        {error && (
          <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming & ongoing</h2>
        <div className="grid gap-3">
          {upcoming.length === 0 ? (
            <div className="rounded-2xl border bg-white p-3 text-sm text-gray-600">
              No upcoming events.
            </div>
          ) : (
            upcoming.map((ev) => <EventCard key={ev.id} event={ev} />)
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Past events</h2>
        <div className="grid gap-3">
          {past.length === 0 ? (
            <div className="rounded-2xl border bg-white p-3 text-sm text-gray-600">
              No past events.
            </div>
          ) : (
            past.map((ev) => <EventCard key={ev.id} event={ev} />)
          )}
        </div>
      </section>
    </div>
  )
}
