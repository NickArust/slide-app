import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body?.eventId || !body?.radiusMi || !body?.startsAt || !body?.endsAt) {
    return NextResponse.json({ error: "eventId, radiusMi, startsAt, endsAt required" }, { status: 400 })
  }

  const startsAt = new Date(body.startsAt)
  const endsAt = new Date(body.endsAt)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: "Invalid startsAt/endsAt" }, { status: 400 })
  }

  const radiusMi = Number(body.radiusMi)
  if (!Number.isFinite(radiusMi) || radiusMi <= 0) {
    return NextResponse.json({ error: "radiusMi must be positive" }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: body.eventId } })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  if (event.createdById !== user.id) {
    return NextResponse.json({ error: "Only the event owner can promote" }, { status: 403 })
  }

  const promo = await prisma.promotion.create({
    data: {
      eventId: body.eventId,
      radiusMi,
      startsAt,
      endsAt,
      budgetCents: Number(body.budgetCents ?? 0)
    }
  })

  return NextResponse.json(promo)
}
