import { prisma } from "@/lib/prisma"
import { ensureSampleEvents } from "@/lib/seedSamples"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureSampleEvents(prisma)

  const events = await prisma.event.findMany({
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ events })
}
