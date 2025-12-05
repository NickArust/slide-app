import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!creator) {
    return NextResponse.json({ error: "User record not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const required = ["title","category","address","startsAt"]
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 })
    }
  }

  const startsAt = new Date(body.startsAt)
  if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 })
  }

  const fallbackDurationMs = 2 * 60 * 60 * 1000
  let endsAt: Date
  if (body.endsAt) {
    endsAt = new Date(body.endsAt)
    if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 })
    }
    if (endsAt <= startsAt) {
      return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 })
    }
  } else {
    endsAt = new Date(startsAt.getTime() + fallbackDurationMs)
  }

  const fallbackCoords = { lat: 28.5383, lng: -81.3792 } // Orlando center-ish
  let coords = fallbackCoords

  const lat = Number(body.lat)
  const lng = Number(body.lng)
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    coords = { lat, lng }
  } else {
    try {
      const geo = await geocodeAddress(body.address)
      if (geo) coords = geo
    } catch (err) {
      console.error("Geocode failed, using fallback coords", err)
    }
  }

  const event = await prisma.event.create({
    data: {
      createdById: creator.id,
      title: body.title,
      category: body.category,
      address: body.address,
      description: body.description ?? "",
      lat: coords.lat,
      lng: coords.lng,
      startsAt,
      endsAt,
      is18Plus: Boolean(body.is18Plus),
      is21Plus: Boolean(body.is21Plus),
    },
  });

  return NextResponse.json(event)
}
