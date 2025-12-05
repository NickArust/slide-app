import { prisma } from "@/lib/prisma"
import { ensureSampleEvents } from "@/lib/seedSamples"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Event } from "@prisma/client"

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371e3
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lon2 - lon1)
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))
  
  // Default 25 miles, but if Premium, allow larger radius
  let radiusMi = Number(searchParams.get("radiusMi") ?? 25)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 })
  }

  if (process.env.NODE_ENV === "development") {
    // Dev-only seed to avoid mutating prod data from read endpoints
    await ensureSampleEvents(prisma)
  }
  
  // LOGIC: Check if user is premium to allow wider search
  const user = session?.user?.email 
    ? await prisma.user.findUnique({ 
        where: { email: session.user.email },
        include: { subscriptions: true, friends: true } 
      }) 
    : null

  const isPremium = user?.subscriptions.some(s => s.active && s.tier === 'PREMIUM_USER')
  const friendIds = user?.friends.map((f) => f.friendId) ?? []
  
  // Enforce limits for non-premium users
  if (!isPremium && radiusMi > 25) radiusMi = 25
  if (radiusMi <= 0) radiusMi = 1

  const meters = radiusMi * 1609.34
  
  // WEIGHTS for Ranking Score
  const DISTANCE_WEIGHT = 1000 // Heavy penalty for distance
  const TIME_WEIGHT = 500      // Penalty for starting too far in future
  const BOOST_SCORE = 5000     // Huge bonus for paid events

  const currentUserId = user?.id || "NO_USER"

  try {
    const events = await prisma.$queryRaw<
      Array<
        Event & {
          distance_meters: number
          isBoosted: boolean
          isFriendHost: boolean
          rank_score: number
          friendGoingCount: number
          creatorUsername: string | null
          creatorName: string | null
          creatorEmail: string | null
          creatorId: string
        }
      >
    >`
      SELECT
        e.id,
        e.title,
        e.category,
        e.address,
        e.lat,
        e.lng,
        e."startsAt",
        e."endsAt",
        e."coverUrl",
        e.visibility,
        e."createdById" as "creatorId",
        u.username as "creatorUsername",
        u.name as "creatorName",
        u.email as "creatorEmail",
        EXISTS (
          SELECT 1 FROM "Friendship" f 
          WHERE f."userId" = ${currentUserId} AND f."friendId" = e."createdById"
        ) as "isFriendHost",
        (
          SELECT COUNT(*) FROM "RSVP" r
          WHERE r."eventId" = e.id
            AND r.status = 'GOING'
            AND EXISTS (
              SELECT 1 FROM "Friendship" f
              WHERE f."userId" = ${currentUserId} AND f."friendId" = r."userId"
            )
        ) as "friendGoingCount",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(e."lng", e."lat"), 4326)::geography,
          ST_MakePoint(${lng}, ${lat})::geography
        ) AS distance_meters,
        COALESCE(p.id IS NOT NULL, false) as "isBoosted",
        (
          (CASE WHEN p.id IS NOT NULL THEN ${BOOST_SCORE} ELSE 0 END)
          - (LN(ST_Distance(ST_SetSRID(ST_MakePoint(e."lng", e."lat"),4326)::geography, ST_MakePoint(${lng}, ${lat})::geography) + 1) * ${DISTANCE_WEIGHT})
          - (ABS(EXTRACT(EPOCH FROM (e."startsAt" - NOW())) / 3600) * ${TIME_WEIGHT})
        ) as rank_score
      FROM "Event" e
      JOIN "User" u ON u.id = e."createdById"
      LEFT JOIN "Promotion" p ON p."eventId" = e.id AND p.status = 'ACTIVE' AND p."endsAt" > NOW()
      WHERE 
        e."endsAt" > NOW()
        AND (
          e.visibility = 'PUBLIC'
          OR e."createdById" = ${currentUserId}
          OR (e.visibility = 'FRIENDS' AND EXISTS (
               SELECT 1 FROM "Friendship" f 
               WHERE f."userId" = ${currentUserId} AND f."friendId" = e."createdById"
             ))
        )
        AND (
          ST_DWithin(
            ST_SetSRID(ST_MakePoint(e."lng", e."lat"), 4326)::geography,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${meters}
          )
          OR p.id IS NOT NULL
        )
      ORDER BY rank_score DESC
      LIMIT 50;
    `

    const normalized = events.map((e) => ({
      ...e,
      friendGoingCount: Number(e.friendGoingCount ?? 0),
    }))

    return NextResponse.json({ events: normalized })
  } catch (err) {
    console.error("Nearby query failed, falling back to simple query (likely PostGIS missing)", err)
    const simpleEvents = await prisma.event.findMany({
      where: { endsAt: { gt: new Date() } },
      orderBy: [{ startsAt: "asc" }],
      take: 50,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const eventIds = simpleEvents.map((e) => e.id)
    const friendCounts = friendIds.length
      ? await prisma.rSVP.groupBy({
          by: ["eventId"],
          where: {
            eventId: { in: eventIds },
            status: "GOING",
            userId: { in: friendIds },
          },
          _count: { eventId: true },
        })
      : []
    const friendCountMap = new Map(friendCounts.map((c) => [c.eventId, c._count.eventId]))

    const withDistance = simpleEvents
      .map((e) => {
        const { createdBy, ...rest } = e
        return {
          ...rest,
          creatorId: createdBy.id,
          creatorUsername: createdBy.username,
          creatorName: createdBy.name,
          creatorEmail: createdBy.email,
          distance_meters: haversineMeters(lat, lng, e.lat, e.lng),
          friendGoingCount: friendCountMap.get(e.id) ?? 0,
        }
      })
      .filter((e) => e.distance_meters <= meters)
      .sort((a, b) => a.distance_meters - b.distance_meters)

    return NextResponse.json({ events: withDistance })
  }
}
