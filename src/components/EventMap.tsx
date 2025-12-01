"use client"

import dynamic from "next/dynamic"

// Dynamically import the real map component *client-side only*
const LeafletMap = dynamic(() => import("./LeafletMapCore"), {
  ssr: false,
})

export default function EventMap(props: any) {
  return <LeafletMap {...props} />
}
