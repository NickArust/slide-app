/*
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { RsvpStatus } from "@prisma/client"

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body?.status || !["GOING","INTERESTED","NOT_GOING"].includes(body.status)) {
    return NextResponse.json({ error: "status required" }, { status: 400 })
  }

  // DEV: use seeker@example.com
  const user = await prisma.user.findFirst({ where: { email: "seeker@example.com" } })
  if (!user) return NextResponse.json({ error: "Seed user missing" }, { status: 500 })

  const rsvp = await prisma.rSVP.upsert({
    where: { userId_eventId: { userId: user.id, eventId: ctx.params.id } },
    update: { status: body.status as RsvpStatus },
    create: { userId: user.id, eventId: ctx.params.id, status: body.status as RsvpStatus }
  })

  return NextResponse.json(rsvp)
}
*/

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { RsvpStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body?.status || !["GOING","INTERESTED","NOT_GOING"].includes(body.status)) {
    return NextResponse.json({ error: "status required" }, { status: 400 })
  }

  // --- Secure Auth Logic ---
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  })
  
  if (!user) {
    return NextResponse.json({ error: "User record not found" }, { status: 404 })
  }
  // -------------------------

  const rsvp = await prisma.rSVP.upsert({
    where: { userId_eventId: { userId: user.id, eventId: ctx.params.id } },
    update: { status: body.status as RsvpStatus },
    create: { userId: user.id, eventId: ctx.params.id, status: body.status as RsvpStatus }
  })

  return NextResponse.json(rsvp)
}