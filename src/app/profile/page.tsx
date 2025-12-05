"use client"

import { useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"

type Friend = { id: string; email: string; name?: string | null; username?: string | null }

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [friendMsg, setFriendMsg] = useState<string | null>(null)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [tab, setTab] = useState<"profile" | "friends">("profile")

  useEffect(() => {
    if (status !== "authenticated") return
    async function load() {
      setLoading(true)
      try {
        const [meRes, friendsRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/friends"),
        ])
        const meData = await meRes.json()
        const frData = await friendsRes.json()
        if (meRes.ok) {
          setName(meData.user?.name ?? "")
          setUsername(meData.user?.username ?? "")
        }
        if (friendsRes.ok) setFriends(frData.friends ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [status])

  if (status === "loading") return <div>Loading...</div>
  if (!session) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">Sign in to manage your profile.</div>
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  async function saveProfile() {
    setSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save")
      setProfileMsg("Profile updated")
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function addFriend() {
    setFriendMsg(null)
    const ident = identifier.trim()
    if (!ident) {
      setFriendMsg("Enter an email or username")
      return
    }
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ident }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not add friend")
      setFriends((prev) => {
        const exists = prev.some((f) => f.id === data.friend.id)
        return exists ? prev : [...prev, data.friend]
      })
      setIdentifier("")
      setFriendMsg("Friend added")
    } catch (err: unknown) {
      setFriendMsg(err instanceof Error ? err.message : "Could not add friend")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Your account</h1>
        <p className="text-sm text-gray-600">
          Update your details or add friends to see what they are attending.
        </p>
        <div className="flex gap-2">
          {(["profile", "friends"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-1 text-sm ${
                tab === t ? "bg-black text-white" : "bg-white hover:bg-gray-100"
              }`}
            >
              {t === "profile" ? "Profile" : "Friends"}
            </button>
          ))}
        </div>
      </div>

      {tab === "profile" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="grid gap-3">
            <label className="space-y-1">
              <div className="text-sm font-medium">Name</div>
              <input
                className="w-full rounded border border-gray-300 bg-white p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </label>
            <label className="space-y-1">
              <div className="text-sm font-medium">Username</div>
              <input
                className="w-full rounded border border-gray-300 bg-white p-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourhandle"
                disabled={loading}
              />
              <div className="text-xs text-gray-500">
                Must be unique. Friends can find you by this or your email.
              </div>
            </label>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {profileMsg && <div className="text-sm text-gray-700">{profileMsg}</div>}
        </div>
      )}

      {tab === "friends" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-lg font-semibold">Friends</div>
              <div className="text-xs text-gray-600">
                Add people by email or username to see when they RSVP.
              </div>
            </div>
            {loading && <div className="text-xs text-gray-500">Loading...</div>}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border border-gray-300 bg-white p-2"
              placeholder="Friend's email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <button
              onClick={addFriend}
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={!identifier.trim()}
            >
              Add
            </button>
          </div>
          {friendMsg && <div className="text-sm text-gray-700">{friendMsg}</div>}
          <div className="divide-y rounded border">
            {friends.length === 0 && (
              <div className="p-3 text-sm text-gray-600">No friends yet.</div>
            )}
            {friends.map((f) => (
              <div key={f.id} className="p-3 text-sm">
                <div className="font-medium">{f.name ?? f.username ?? f.email}</div>
                <div className="text-gray-500">
                  {f.username ? `@${f.username}` : f.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
