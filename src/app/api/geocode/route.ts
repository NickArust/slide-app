import { NextResponse } from "next/server"
import { geocodeAddress } from "@/lib/geocode"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address || address.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing address parameter" },
      { status: 400 }
    )
  }

  try {
    const result = await geocodeAddress(address)
    if (!result) {
      return NextResponse.json(
        { error: "Could not geocode that address" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      lat: result.lat,
      lng: result.lng,
      label: address,
    })
  } catch (err: any) {
    console.error("Geocode error:", err)
    return NextResponse.json(
      { error: "Geocoding service error" },
      { status: 500 }
    )
  }
}
