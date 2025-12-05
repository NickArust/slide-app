import { NextResponse } from "next/server"
import { suggestAddresses } from "@/lib/geocode"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  if (!query || query.trim().length < 3) {
    return NextResponse.json(
      { error: "Query must be at least 3 characters" },
      { status: 400 }
    )
  }

  try {
    const suggestions = await suggestAddresses(query.trim(), 5)
    return NextResponse.json({ suggestions })
  } catch (err: unknown) {
    console.error("Suggest error:", err)
    return NextResponse.json(
      { error: "Suggestion service error" },
      { status: 500 }
    )
  }
}
