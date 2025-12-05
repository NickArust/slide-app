import { format, isSameDay } from "date-fns"
import Link from "next/link"
import { HostProfileTrigger } from "./HostProfileModal"

type Props = {
  // In a real app, you might share this interface with the API response type
  event: {
    id: string
    title: string
    category: string
    address: string
    startsAt: string | Date
    endsAt: string | Date
    distance_meters?: number
    meters?: number
    isBoosted?: boolean
    isFriendHost?: boolean
    friendGoingCount?: number
    creatorUsername?: string | null
    creatorName?: string | null
    creatorEmail?: string | null
    creatorId?: string
    createdById?: string
  }
}

export default function EventCard({ event }: Props) {
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)
  const sameDay = isSameDay(start, end)
  const timeRange = sameDay
    ? `${format(start, "EEE MMM d, h:mma")} - ${format(end, "h:mma")}`
    : `${format(start, "EEE MMM d, h:mma")} - ${format(end, "EEE MMM d, h:mma")}`

  const hostLabel = event.creatorUsername
    ? `@${event.creatorUsername}`
    : event.creatorName ?? event.creatorEmail ?? "Host"
  const hostId = event.creatorId ?? event.createdById

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div
        className={`rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition relative ${
          event.isBoosted ? "ring-2 ring-yellow-400/50" : ""
        }`}
      >
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 pointer-events-none">
          {event.isBoosted && (
            <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
              Promoted
            </span>
          )}
          {event.isFriendHost && (
            <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
              Friend
            </span>
          )}
        </div>

        <div className="text-lg font-semibold pr-16">{event.title}</div>
        <div className="text-sm text-gray-600">{event.category}</div>
        <div className="mt-1 text-sm">{timeRange}</div>
        <div className="mt-1 text-xs text-gray-700">
          Hosted by{" "}
          <HostProfileTrigger
            hostId={hostId}
            hostLabel={hostLabel}
            isFriendHost={event.isFriendHost}
            className="inline"
          />
        </div>
        <div className="mt-1 text-sm">{event.address}</div>
        <div className="mt-2 text-xs text-gray-500">
          {event.distance_meters != null
            ? `${Math.round(event.distance_meters)} m away`
            : event.meters != null
              ? `${Math.round(event.meters)} m away`
              : null}
        </div>
        {event.friendGoingCount && event.friendGoingCount > 0 && (
          <div className="mt-2 text-xs font-semibold text-green-700">
            {event.friendGoingCount}{" "}
            {event.friendGoingCount === 1 ? "friend" : "friends"} RSVP&apos;d Yes
          </div>
        )}
      </div>
    </Link>
  )
}
