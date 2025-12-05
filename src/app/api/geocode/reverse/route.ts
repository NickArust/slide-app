import { NextResponse } from "next/server"
import { reverseGeocode } from "@/lib/geocode"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required" },
      { status: 400 }
    )
  }

  try {
    const result = await reverseGeocode(lat, lng)
    if (!result) {
      return NextResponse.json({ error: "No address found" }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error("Reverse geocode error:", err)
    return NextResponse.json(
      { error: "Reverse geocoding service error" },
      { status: 500 }
    )
  }
}
