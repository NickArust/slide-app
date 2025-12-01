import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))
  const radiusMi = Number(searchParams.get("radiusMi") ?? 5)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 })
  }

  const meters = radiusMi * 1609.34

  const events = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      e.id,
      e."createdById",
      e."businessId",
      e.title,
      e.description,
      e.category,
      e.address,
      e.lat,
      e.lng,
      e."startsAt",
      e."endsAt",
      e."coverUrl",
      e."isPrivate",
      e.visibility,
      e."is18Plus",
      e."is21Plus",
      e."createdAt",
      e."updatedAt",
      ST_Distance(
        e.geom,
        ST_MakePoint(${lng}, ${lat})::geography
      ) AS meters,
      EXTRACT(EPOCH FROM (e."startsAt" - NOW())) AS seconds_to_start
    FROM "Event" e
    WHERE e.geom IS NOT NULL
      AND ST_DWithin(
        e.geom,
        ST_MakePoint(${lng}, ${lat})::geography,
        ${meters}
      )
      AND e."endsAt" > NOW()
    ORDER BY
      CASE WHEN e."startsAt" < NOW() THEN 0 ELSE 1 END DESC,
      seconds_to_start ASC,
      meters ASC
    LIMIT 50;
  `)


  return NextResponse.json({ events })
}
