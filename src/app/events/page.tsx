"use client"

import { useEffect, useState } from "react"
import EventCard from "@/components/EventCard"

export default function HomePage() {
  const [lat, setLat] = useState<number | null>(28.5383) // Orlando default
  const [lng, setLng] = useState<number | null>(-81.3792)
  const [radius, setRadius] = useState<number>(5)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [addressQuery, setAddressQuery] = useState("") // for step 2

  async function load() {
    if (lat == null || lng == null) return
    setLoading(true)
    setStatusMsg(null)
    try {
      const r = await fetch(
        `/api/events/nearby?lat=${lat}&lng=${lng}&radiusMi=${radius}`
      )
      const j = await r.json()
      setEvents(j.events ?? [])
      if ((j.events ?? []).length === 0) {
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

  // STEP 1: Use browser geolocation
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
        // load() will be triggered by useEffect
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

  // STEP 2 will go here (address search); we’ll fill below.

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
      // useEffect will reload events
    } catch (err) {
      console.error(err)
      setStatusMsg("Error contacting geocoding service.")
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Events near you</h1>

      {/* Controls */}
      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Search center:</span>
          <input
            className="w-28 rounded border p-2 text-sm"
            type="number"
            step="0.0001"
            value={lat ?? ""}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            placeholder="lat"
          />
          <input
            className="w-28 rounded border p-2 text-sm"
            type="number"
            step="0.0001"
            value={lng ?? ""}
            onChange={(e) => setLng(parseFloat(e.target.value))}
            placeholder="lng"
          />
          <select
            className="rounded border p-2 text-sm"
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

        {/* Use my location + address search */}
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
            className="flex-1 min-w-[180px] rounded border p-2 text-sm"
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

      {/* Results */}
      <div className="grid gap-3">
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  )
}
