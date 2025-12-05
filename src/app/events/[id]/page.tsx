import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format, isSameDay } from "date-fns"
import { RsvpWidget } from "@/components/RsvpWidget"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { RsvpStatus } from "@prisma/client"
import { FriendGoingList } from "@/components/FriendGoingList"
import { HostProfileTrigger } from "@/components/HostProfileModal"

type Params = { params: { id: string } }

export default async function EventPage({ params }: Params) {
  const ev = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: { id: true, name: true, username: true, email: true },
      },
    },
  })
  if (!ev) return notFound()

  const session = await getServerSession(authOptions)
  let userStatus: RsvpStatus | null = null
  let isFriendHost = false
  let friendGoing: Array<{ id: string; name: string | null; username: string | null; email: string }> = []

  if (session?.user?.email) {
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        friends: { include: { friend: true } },
      },
    })
    if (me) {
      const rsvp = await prisma.rSVP.findUnique({
        where: { userId_eventId: { userId: me.id, eventId: ev.id } },
      })
      userStatus = rsvp?.status ?? null

      const friendIds = me.friends.map((f) => f.friendId)
      isFriendHost = friendIds.includes(ev.createdById)
      if (friendIds.length) {
        const going = await prisma.rSVP.findMany({
          where: {
            eventId: ev.id,
            status: "GOING",
            userId: { in: friendIds },
          },
          include: { user: true },
        })
        friendGoing = going.map((r) => ({
          id: r.user.id,
          name: r.user.name,
          username: r.user.username,
          email: r.user.email,
        }))
      }
    }
  }

  const counts = await prisma.rSVP.groupBy({
    by: ["status"],
    where: { eventId: ev.id },
    _count: { status: true },
  })

  const totalGoing = counts
    .filter((c) => c.status === "GOING")
    .reduce((a, c) => a + (c._count?.status || 0), 0)

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{ev.title}</h1>
      <div className="text-sm text-gray-600">{ev.category} - {ev.address}</div>
      <div className="text-sm">
        {isSameDay(ev.startsAt, ev.endsAt)
          ? `${format(ev.startsAt, "EEE MMM d, h:mma")} - ${format(ev.endsAt, "h:mma")}`
          : `${format(ev.startsAt, "EEE MMM d, h:mma")} - ${format(ev.endsAt, "EEE MMM d, h:mma")}`}
      </div>
      <div className="text-xs text-gray-700">
        Hosted by{" "}
        <HostProfileTrigger
          hostId={ev.createdBy.id}
          hostLabel={
            ev.createdBy.username
              ? `@${ev.createdBy.username}`
              : ev.createdBy.name ?? ev.createdBy.email ?? "Host"
          }
          isFriendHost={isFriendHost}
        />
      </div>
      <div className="text-sm">RSVPs (public count): {totalGoing}</div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2 text-sm">
        <div className="font-semibold">Friends attending</div>
        {!session && <div className="text-gray-600">Sign in to see which friends are going.</div>}
        {session && friendGoing.length === 0 && (
          <div className="text-gray-600">No friends have RSVP&apos;d Yes yet.</div>
        )}
        {friendGoing.length > 0 && (
          <FriendGoingList friends={friendGoing} />
        )}
      </div>
      <div className="mt-6 text-sm text-gray-700">
        {ev.description || "No description provided."}
      </div>
      <div className="pt-4">
        <RsvpWidget
          eventId={ev.id}
          initialStatus={userStatus}
          initialGoingCount={totalGoing}
        />
      </div>
    </div>
  )
}
