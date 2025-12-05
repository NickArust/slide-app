"use client"

import dynamic from "next/dynamic"

// Dynamically import the real map component *client-side only*
const LeafletMap = dynamic(() => import("./LeafletMapCore"), {
  ssr: false,
})

type EventMapProps = {
  center: { lat: number; lng: number }
  events: Array<{ id: string; lat: number; lng: number; title: string }>
}

export default function EventMap(props: EventMapProps) {
  return <LeafletMap {...props} />
}
