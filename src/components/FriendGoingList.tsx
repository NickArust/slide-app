"use client"

import { useState } from "react"

type Friend = {
  id: string
  name: string | null
  username: string | null
  email: string
}

export function FriendGoingList({ friends }: { friends: Friend[] }) {
  const [selected, setSelected] = useState<Friend | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {friends.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelected(f)}
            className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-100"
          >
            {f.name ?? f.username ?? f.email}
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <div className="text-sm font-semibold">
              {selected.name ?? "No name set"}
            </div>
            <div className="mt-1 text-xs text-gray-700">
              Username: {selected.username ? `@${selected.username}` : "Not set"}
            </div>
            <div className="text-xs text-gray-700">Email: {selected.email}</div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
