import { format } from "date-fns"
import Link from "next/link"

type Props = {
  event: any
}

export default function EventCard({ event }: Props) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
        <div className="text-lg font-semibold">{event.title}</div>
        <div className="text-sm text-gray-600">{event.category}</div>
        <div className="mt-1 text-sm">
          {format(new Date(event.startsAt), "EEE MMM d, h:mma")} –{" "}
          {format(new Date(event.endsAt), "h:mma")}
        </div>
        <div className="mt-1 text-sm">{event.address}</div>
        <div className="mt-2 text-xs text-gray-500">
          {event.meters != null ? `${Math.round(event.meters)} m away` : null}
        </div>
      </div>
    </Link>
  )
}
