import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const ev = await prisma.event.findUnique({ where: { id: ctx.params.id } })
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(ev)
}
