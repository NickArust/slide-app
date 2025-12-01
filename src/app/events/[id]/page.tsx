import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"

type Params = { params: { id: string } }

export default async function EventPage({ params }: Params) {
  const ev = await prisma.event.findUnique({ where: { id: params.id } })
  if (!ev) return notFound()

  const counts = await prisma.rSVP.groupBy({
    by: ["status"],
    where: { eventId: ev.id },
    _count: { status: true }
  })

  const totalGoing = counts.filter(c => c.status === "GOING").reduce((a, c) => a + (c._count?.status || 0), 0)

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{ev.title}</h1>
      <div className="text-sm text-gray-600">{ev.category} • {ev.address}</div>
      <div className="text-sm">
        {format(ev.startsAt, "EEE MMM d, h:mma")} – {format(ev.endsAt, "h:mma")}
      </div>
      <div className="text-sm">RSVPs (public count): {totalGoing}</div>
      <div className="mt-6 text-sm text-gray-700">
        {ev.description || "No description provided."}
      </div>
    </div>
  )
}
