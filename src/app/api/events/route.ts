import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const required = ["title","category","address","lat","lng","startsAt","endsAt"]
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 })
    }
  }

  const event = await prisma.event.create({
    data: {
      createdById: (await prisma.user.findFirst({ where: { email: "promoter@example.com" } }))!.id, // DEV: use a seeded promoter
      title: body.title,
      category: body.category,
      address: body.address,
      description: body.description ?? "", 
      lat: Number(body.lat),
      lng: Number(body.lng),
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      is18Plus: Boolean(body.is18Plus),
      is21Plus: Boolean(body.is21Plus)
    }
  })

  // Update geom from lat/lng
  await prisma.$executeRawUnsafe(`
    UPDATE "Event"
    SET geom = ST_SetSRID(ST_MakePoint("lng","lat"),4326)::geography
    WHERE id = '${event.id}';
  `)

  return NextResponse.json(event)
}
