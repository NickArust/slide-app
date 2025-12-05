import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      friends: {
        include: { friend: true },
      },
    },
  })
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const friends = me.friends.map((f) => ({
    id: f.friend.id,
    email: f.friend.email,
    name: f.friend.name,
    username: f.friend.username,
  }))

  return NextResponse.json({ friends })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const identifier = body?.identifier as string | undefined
  if (!identifier || identifier.trim().length < 2) {
    return NextResponse.json(
      { error: "identifier (email or username) required" },
      { status: 400 }
    )
  }

  const me = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const target = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    },
  })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (target.id === me.id) {
    return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 })
  }

  const makeFriend = async (userId: string, friendId: string) =>
    prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId } },
      update: {},
      create: { userId, friendId },
    })

  await Promise.all([
    makeFriend(me.id, target.id),
    makeFriend(target.id, me.id),
  ])

  return NextResponse.json({
    ok: true,
    friend: {
      id: target.id,
      email: target.email,
      name: target.name,
      username: target.username,
    },
  })
}
