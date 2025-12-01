"use client"

import { useEffect, useState } from "react"
import EventCard from "@/components/EventCard"

export default function HomePage() {
  const [lat, setLat] = useState<number | null>(28.5383) // Orlando default
  const [lng, setLng] = useState<number | null>(-81.3792)
  const [radius, setRadius] = useState<number>(5)
  const [events, setEvents] = useState<any[]>([])

  async function load() {
    if (lat == null || lng == null) return
    const r = await fetch(`/api/events/nearby?lat=${lat}&lng=${lng}&radiusMi=${radius}`)
    const j = await r.json()
    setEvents(j.events)
  }

  useEffect(() => { load() }, [lat, lng, radius])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Events near you</h1>
      <div className="flex flex-wrap gap-2">
        <input className="w-28 rounded border p-2" type="number" step="0.0001" value={lat ?? ""} onChange={e => setLat(parseFloat(e.target.value))} placeholder="lat" />
        <input className="w-28 rounded border p-2" type="number" step="0.0001" value={lng ?? ""} onChange={e => setLng(parseFloat(e.target.value))} placeholder="lng" />
        <select className="rounded border p-2" value={radius} onChange={e => setRadius(parseInt(e.target.value))}>
          <option value={5}>5 mi</option>
          <option value={10}>10 mi</option>
          <option value={25}>25 mi</option>
        </select>
        <button className="rounded border px-3 py-2" onClick={load}>Refresh</button>
      </div>

      <div className="grid gap-3">
        {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
      </div>
    </div>
  )
}
