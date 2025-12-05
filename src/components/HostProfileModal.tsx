"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format, isSameDay } from "date-fns"

type EventSummary = {
  id: string
  title: string
  category: string
  address: string
  startsAt: string
  endsAt: string
}

type HostProfile = {
  host: { id: string; name: string | null; username: string | null }
  isFriend: boolean
  upcomingEvents: EventSummary[]
  pastEvents: EventSummary[]
}

function formatRange(startISO: string, endISO: string) {
  const start = new Date(startISO)
  const end = new Date(endISO)
  return isSameDay(start, end)
    ? `${format(start, "EEE MMM d, h:mma")} - ${format(end, "h:mma")}`
    : `${format(start, "EEE MMM d, h:mma")} - ${format(end, "EEE MMM d, h:mma")}`
}

export function HostProfileModal({
  hostId,
  open,
  onClose,
}: {
  hostId: string
  open: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<HostProfile | null>(null)

  useEffect(() => {
    if (!open) return
    if (!hostId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/users/${hostId}/public`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to load host profile")
        if (cancelled) return
        setProfile(data)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load host profile")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, hostId])

  const hostLabel = useMemo(() => {
    if (!profile?.host) return ""
    const { username, name } = profile.host
    if (username) return `@${username}`
    if (name) return name
    return "Host"
  }, [profile])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-base font-semibold">{hostLabel || "Host"}</div>
            {profile?.host?.name && (
              <div className="text-xs text-gray-600">{profile.host.name}</div>
            )}
            {profile?.host?.username && (
              <div className="text-xs text-gray-500">@{profile.host.username}</div>
            )}
            {profile?.isFriend && (
              <div className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-800">
                Friend
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading host profile...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && profile && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Upcoming events</span>
                <span className="text-xs text-gray-500">
                  {profile.upcomingEvents.length || "0"}
                </span>
              </div>
              {profile.upcomingEvents.length === 0 && (
                <div className="text-xs text-gray-600">No upcoming public events.</div>
              )}
              <div className="space-y-2">
                {profile.upcomingEvents.map((ev) => {
                  const now = Date.now()
                  const start = new Date(ev.startsAt).getTime()
                  const end = new Date(ev.endsAt).getTime()
                  const isOngoing = start <= now && now <= end
                  return (
                    <Link
                      key={ev.id}
                      href={`/events/${ev.id}`}
                      className={`block rounded border px-3 py-2 hover:bg-gray-100 ${
                        isOngoing ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-xs text-gray-600">{ev.category}</div>
                      <div className="text-xs text-gray-700">{formatRange(ev.startsAt, ev.endsAt)}</div>
                      {isOngoing && (
                        <div className="mt-1 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-yellow-800">
                          Happening now
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Past events</span>
                <span className="text-xs text-gray-500">
                  {profile.pastEvents.length || "0"}
                </span>
              </div>
              {profile.pastEvents.length === 0 && (
                <div className="text-xs text-gray-600">No past public events.</div>
              )}
              <div className="space-y-2">
                {profile.pastEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="block rounded border px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-xs text-gray-600">{ev.category}</div>
                    <div className="text-xs text-gray-700">{formatRange(ev.startsAt, ev.endsAt)}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function HostProfileTrigger({
  hostId,
  hostLabel,
  isFriendHost,
  className = "",
  children,
}: {
  hostId?: string
  hostLabel: string
  isFriendHost?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  if (!hostId) {
    return (
      <span className={className}>
        {children ?? hostLabel}
        {isFriendHost && (
          <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
            Friend
          </span>
        )}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
        className={`font-semibold text-blue-700 hover:underline ${className}`}
      >
        {children ?? hostLabel}
        {isFriendHost && (
          <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
            Friend
          </span>
        )}
      </button>
      <HostProfileModal hostId={hostId} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
