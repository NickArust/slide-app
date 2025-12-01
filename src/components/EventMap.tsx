"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import Link from "next/link"

const eventIcon = new L.Icon({
  iconUrl: "location-pin.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

function ChangeView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  map.setView([lat, lng], 13)
  return null
}

export default function EventMap({
  center,
  events
}: {
  center: { lat: number; lng: number }
  events: any[]
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={true}
      className="h-[400px] w-full rounded-xl border"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <ChangeView lat={center.lat} lng={center.lng} />

      {events.map((ev) => (
        <Marker
          key={ev.id}
          position={[ev.lat, ev.lng]}
          icon={eventIcon}
        >
          <Popup>
            <div className="text-sm font-semibold">{ev.title}</div>
            <Link href={`/events/${ev.id}`} className="text-xs underline">
              View details
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
