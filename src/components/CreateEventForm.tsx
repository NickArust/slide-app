"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const FormSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  address: z.string().min(3),
  description: z.string().max(1000).optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  is18Plus: z.coerce.boolean().default(false),
  is21Plus: z.coerce.boolean().default(false),
});


type FormData = z.infer<typeof FormSchema>

export default function CreateEventForm() {
  const { register, handleSubmit } = useForm<FormData>()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    setLoading(true); setMsg(null)
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    const json = await res.json()
    setLoading(false)
    setMsg(res.ok ? `Created event ${json.title}` : `Error: ${json.error ?? "unknown"}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input className="w-full rounded border p-2" placeholder="Title" {...register("title")} />
      <input className="w-full rounded border p-2" placeholder="Category (Bars, Live Music, ...)" {...register("category")} />
      <input className="w-full rounded border p-2" placeholder="Address" {...register("address")} />
      <textarea
        className="w-full rounded border p-2 h-24"
        placeholder="Details about this event (lineup, specials, vibe...)"
        {...register("description")}
      />

      <div className="grid grid-cols-2 gap-2">
        <input type="datetime-local" className="rounded border p-2" {...register("startsAt")} />
        <input type="datetime-local" className="rounded border p-2" {...register("endsAt")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is18Plus")} /> 18+
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is21Plus")} /> 21+
      </label>
      <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={loading}>
        {loading ? "Creating..." : "Create Event"}
      </button>
      {msg && <div className="text-sm">{msg}</div>}
    </form>
  )
}
