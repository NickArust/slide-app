"use client"

import { useEffect, useState } from "react"
import EventCard from "@/components/EventCard"
import EventMap from "@/components/EventMap"

type EventWithMeters = {
  id: string
  title: string
  category: string
  address: string
  lat: number
  lng: number
  startsAt: string
  endsAt: string
  meters?: number
  distance_meters?: number
  friendGoingCount?: number
  isBoosted?: boolean
  isFriendHost?: boolean
  creatorUsername?: string | null
  creatorName?: string | null
  creatorEmail?: string | null
  creatorId?: string
}

export default function HomePage() {
  const [lat, setLat] = useState<number | null>(28.5383) // Orlando default
  const [lng, setLng] = useState<number | null>(-81.3792)
  const [radius, setRadius] = useState<number>(5)
  const [events, setEvents] = useState<EventWithMeters[]>([])
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [addressQuery, setAddressQuery] = useState("")
  const [debugMode, setDebugMode] = useState(false)

  async function load() {
    if (lat == null || lng == null) return
    const radiusMi = Math.max(1, Math.min(radius, 100))
    setLoading(true)
    setStatusMsg(null)
    try {
      const r = await fetch(
        `/api/events/nearby?lat=${lat}&lng=${lng}&radiusMi=${radiusMi}`
      )
      const j = await r.json()
      const evs = (j.events ?? []) as EventWithMeters[]
      setEvents(evs)
      if (evs.length === 0) {
        setStatusMsg("No events found in this area. Try a larger radius.")
      }
    } catch (err) {
      console.error(err)
      setStatusMsg("Error loading events.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radius])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatusMsg("Geolocation is not supported in this browser.")
      return
    }
    setStatusMsg("Requesting your location...")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLat(latitude)
        setLng(longitude)
        setStatusMsg("Location set from your device.")
      },
      (err) => {
        console.error(err)
        if (err.code === err.PERMISSION_DENIED) {
          setStatusMsg("Location permission denied. You can still type a city or ZIP.")
        } else {
          setStatusMsg("Could not get your location.")
        }
      }
    )
  }

  async function setLocationFromAddress() {
    if (!addressQuery.trim()) {
      setStatusMsg("Please enter an address, city, or ZIP.")
      return
    }
    setStatusMsg("Looking up that location...")
    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(addressQuery.trim())}`
      )
      const data = await res.json()
      if (!res.ok || !data.lat || !data.lng) {
        setStatusMsg(data.error ?? "Could not geocode that address.")
        return
      }
      setLat(data.lat)
      setLng(data.lng)
      setStatusMsg(`Location set to ${data.label ?? "that area"}.`)
    } catch (err) {
      console.error(err)
      setStatusMsg("Error contacting geocoding service.")
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Events near you</h1>

      {/* Controls card */}
      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        {/* Debug + radius + refresh row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDebugMode((v) => !v)}
            className="rounded border px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            {debugMode ? "Hide debug" : "Show debug"}
          </button>

          {debugMode && (
            <>
              <input
                className="w-28 rounded border border-gray-400 bg-white p-2 text-sm"
                type="number"
                step="0.0001"
                value={lat ?? ""}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                placeholder="lat"
              />
              <input
                className="w-28 rounded border border-gray-400 bg-white p-2 text-sm"
                type="number"
                step="0.0001"
                value={lng ?? ""}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                placeholder="lng"
              />
            </>
          )}

          <select
            className="rounded border border-gray-400 bg-white p-2 text-sm"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
          >
            <option value={5}>5 mi</option>
            <option value={10}>10 mi</option>
            <option value={25}>25 mi</option>
          </select>

          <button
            className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Use my location + address search row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-full bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
          >
            Use my location
          </button>

          <span className="text-xs text-gray-500">or</span>

          <input
            className="flex-1 min-w-[180px] rounded border border-gray-400 bg-white p-2 text-sm"
            placeholder="Enter an address, city, or ZIP"
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={setLocationFromAddress}
            className="rounded border px-3 py-2 text-xs hover:bg-gray-100"
          >
            Set from address
          </button>
        </div>

        {statusMsg && (
          <div className="text-xs text-gray-600">{statusMsg}</div>
        )}
      </div>

      {/* Map */}
      {lat != null && lng != null && events.length > 0 && (
        <EventMap center={{ lat, lng }} events={events} />
      )}

      {/* Events list */}
      <div className="grid gap-3">
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  )
}
