import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, username: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({ user })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const name = body?.name as string | undefined
  const username = body?.username as string | undefined

  if (!name && !username) {
    return NextResponse.json(
      { error: "Provide name or username to update" },
      { status: 400 }
    )
  }

  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name ?? undefined,
        username: username ? username.toLowerCase() : undefined,
      },
      select: { id: true, email: true, name: true, username: true },
    })
    return NextResponse.json({ user })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }
    console.error("Profile update error", err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
