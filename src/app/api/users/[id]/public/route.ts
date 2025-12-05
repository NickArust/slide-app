import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EventVisibility } from "@prisma/client"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

const PUBLIC_VISIBILITY = [EventVisibility.PUBLIC, EventVisibility.LINK]

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const hostId = params.id
  const session = await getServerSession(authOptions)
  const viewerEmail = session?.user?.email ?? null

  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: { id: true, name: true, username: true },
  })
  if (!host) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  let viewerId: string | null = null
  if (viewerEmail) {
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail },
      select: { id: true },
    })
    viewerId = viewer?.id ?? null
  }

  const isFriend = viewerId
    ? !!(await prisma.friendship.findFirst({
        where: { userId: viewerId, friendId: hostId },
      }))
    : false

  const now = new Date()
  const upcomingEvents = await prisma.event.findMany({
    where: {
      createdById: hostId,
      visibility: { in: PUBLIC_VISIBILITY },
      endsAt: { gte: now },
    },
    orderBy: { startsAt: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      category: true,
      address: true,
      startsAt: true,
      endsAt: true,
    },
  })

  const pastEvents = await prisma.event.findMany({
    where: {
      createdById: hostId,
      visibility: { in: PUBLIC_VISIBILITY },
      endsAt: { lt: now },
    },
    orderBy: { endsAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      category: true,
      address: true,
      startsAt: true,
      endsAt: true,
    },
  })

  return NextResponse.json({
    host,
    isFriend,
    upcomingEvents,
    pastEvents,
  })
}
