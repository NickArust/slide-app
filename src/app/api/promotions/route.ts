import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.eventId || !body?.radiusMi || !body?.startsAt || !body?.endsAt) {
    return NextResponse.json({ error: "eventId, radiusMi, startsAt, endsAt required" }, { status: 400 })
  }

  const promo = await prisma.promotion.create({
    data: {
      eventId: body.eventId,
      radiusMi: Number(body.radiusMi),
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      budgetCents: Number(body.budgetCents ?? 0)
    }
  })

  return NextResponse.json(promo)
}
