"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"

const FormSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  address: z.string().min(3),
  description: z.string().max(1000).optional(),
  startDate: z.string(),
  startHour: z.string(),
  startMinute: z.string(),
  startPeriod: z.enum(["AM", "PM"]),
  endDate: z.string().optional(),
  endHour: z.string().optional(),
  endMinute: z.string().optional(),
  endPeriod: z.enum(["AM", "PM"]).optional(),
  is18Plus: z.coerce.boolean().default(false),
  is21Plus: z.coerce.boolean().default(false),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});


type FormData = z.infer<typeof FormSchema>

type CalendarInputProps = {
  label: string
  value?: string
  onSelect: (val: string) => void
}

function CalendarInput({ label, value, onSelect }: CalendarInputProps) {
  const today = new Date()
  const initial = value ? parseISO(value) : today
  const [currentMonth, setCurrentMonth] = useState<Date>(initial)
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
      }),
    [currentMonth]
  )

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
          >
            ‹
          </button>
          <span className="text-xs text-gray-600">{format(currentMonth, "MMM yyyy")}</span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const selected = value ? isSameDay(parseISO(value), day) : false
          const muted = !isSameMonth(day, currentMonth)
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`rounded p-2 text-sm ${
                selected
                  ? "bg-black text-white"
                  : muted
                    ? "text-gray-400 hover:bg-gray-100"
                    : "text-gray-800 hover:bg-gray-100"
              }`}
              onClick={() => onSelect(format(day, "yyyy-MM-dd"))}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CreateEventForm() {
  const today = new Date().toISOString().split("T")[0]
  const { register, handleSubmit, setValue, watch, resetField } = useForm<FormData>({
    defaultValues: {
      startDate: today,
      startHour: "07",
      startMinute: "00",
      startPeriod: "PM",
      endDate: undefined,
      endHour: undefined,
      endMinute: undefined,
      endPeriod: undefined,
    },
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<
    { label: string; lat: number; lng: number }[]
  >([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [showEndTime, setShowEndTime] = useState(false)

  const hourOptions = Array.from({ length: 12 }, (_, idx) => `${idx + 1}`.padStart(2, "0"))
  const minuteOptions = ["00", "15", "30", "45"]

  function buildDateTime(date: string | undefined, hour: string | undefined, minute: string | undefined, period: "AM" | "PM" | undefined) {
    if (!date || !hour || !minute || !period) return null

    const hourNum = Number(hour)
    const minuteNum = Number(minute)
    if (Number.isNaN(hourNum) || Number.isNaN(minuteNum)) return null
    if (hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) return null

    const hour24 = (hourNum % 12) + (period === "PM" ? 12 : 0)
    const isoString = `${date}T${String(hour24).padStart(2, "0")}:${String(minuteNum).padStart(2, "0")}:00`
    const dateTime = new Date(isoString)
    return Number.isNaN(dateTime.getTime()) ? null : dateTime
  }

  function clearEndTime() {
    setShowEndTime(false)
    resetField("endDate")
    resetField("endHour")
    resetField("endMinute")
    resetField("endPeriod")
  }

  // Debounced suggestion fetch
  async function fetchSuggestions(query: string) {
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      return
    }
    setSuggestLoading(true)
    try {
      const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (res.ok) {
        setSuggestions(data.suggestions ?? [])
      } else {
        setSuggestions([])
      }
    } catch {
      setSuggestions([])
    } finally {
      setSuggestLoading(false)
    }
  }

  // Use my location -> reverse geocode for label + coords
  async function useMyLocation() {
    if (!navigator.geolocation) {
      setMsg("Geolocation not supported by this browser.")
      return
    }
    setMsg("Getting your location...")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setValue("lat", latitude)
        setValue("lng", longitude)
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`)
          const data = await res.json()
          if (res.ok && data.label) {
            setValue("address", data.label)
          } else {
            setValue("address", "Pinned location")
          }
          setMsg("Location set from device.")
        } catch (err) {
          console.error(err)
          setValue("address", "Pinned location")
          setMsg("Location set from device.")
        }
      },
      (err) => {
        console.error(err)
        setMsg("Could not get your location.")
      }
    )
  }

  const onSubmit = async (data: FormData) => {
    const startsAtDate = buildDateTime(
      data.startDate,
      data.startHour,
      data.startMinute,
      data.startPeriod
    )

    if (!startsAtDate) {
      setMsg("Please enter a valid start date and time.")
      return
    }

    const hasEndInput = showEndTime

    let endsAtDate: Date | null = null
    if (hasEndInput) {
      const endDateVal = data.endDate || data.startDate
      const endPeriodVal = (data.endPeriod as "AM" | "PM" | undefined) ?? data.startPeriod
      endsAtDate = buildDateTime(
        endDateVal,
        data.endHour,
        data.endMinute,
        endPeriodVal
      )

      if (!endsAtDate) {
        setMsg("Please enter a valid end time or leave it blank.")
        return
      }
      if (endsAtDate <= startsAtDate) {
        setMsg("End time must be after start time.")
        return
      }
    }

    setLoading(true)
    setMsg(null)
    try {
      const payload = {
        title: data.title,
        category: data.category,
        address: data.address,
        description: data.description,
        startsAt: startsAtDate.toISOString(),
        ...(endsAtDate ? { endsAt: endsAtDate.toISOString() } : {}),
        is18Plus: data.is18Plus,
        is21Plus: data.is21Plus,
        lat: data.lat,
        lng: data.lng,
      }
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error ?? `Request failed (${res.status})`)
      }
      setMsg(`Created event ${json?.title ?? "event"}`)
    } catch (err) {
      setMsg(
        err instanceof Error ? `Error: ${err.message}` : "Error creating event"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input className="w-full rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 p-2" placeholder="Title" {...register("title")} />
      <input className="w-full rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 p-2" placeholder="Category (Bars, Live Music, ...)" {...register("category")} />

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 p-2"
            placeholder="Address"
            {...register("address")}
            onChange={(e) => {
              register("address").onChange(e)
              fetchSuggestions(e.target.value)
            }}
          />
          <button
            type="button"
            onClick={useMyLocation}
            className="whitespace-nowrap rounded border px-3 py-2 text-xs hover:bg-gray-100"
          >
            Use my location
          </button>
        </div>
        {suggestLoading && (
          <div className="text-xs text-gray-500">Searching...</div>
        )}
        {suggestions.length > 0 && (
          <div className="rounded border bg-white shadow-sm">
            {suggestions.map((sugg) => (
              <button
                key={`${sugg.label}-${sugg.lat}-${sugg.lng}`}
                type="button"
                className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
                onClick={() => {
                  setValue("address", sugg.label)
                  setValue("lat", sugg.lat)
                  setValue("lng", sugg.lng)
                  setSuggestions([])
                }}
              >
                {sugg.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <input type="hidden" {...register("lat")} />
      <input type="hidden" {...register("lng")} />
      <textarea
        className="w-full rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 p-2 h-24"
        placeholder="Details about this event (lineup, specials, vibe...)"
        {...register("description")}
      />

      <div className="space-y-3 rounded-2xl border bg-white p-3 shadow-sm">
        <div className="space-y-3">
          <CalendarInput
            label="Start date"
            value={watch("startDate")}
            onSelect={(val) => setValue("startDate", val)}
          />
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-2">
              <input
                className="rounded border border-gray-300 bg-white p-2 text-center"
                inputMode="numeric"
                placeholder="HH"
                list="hour-wheel"
                {...register("startHour")}
              />
              <input
                className="rounded border border-gray-300 bg-white p-2 text-center"
                inputMode="numeric"
                placeholder="MM"
                list="minute-wheel"
                {...register("startMinute")}
              />
              <select
                className="rounded border border-gray-300 bg-white p-2 text-center"
                {...register("startPeriod")}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="font-medium text-gray-700">Quick minutes (15-min wheel):</span>
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValue("startMinute", m)}
                  className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
                >
                  :{m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-800">End time (optional)</span>
            {showEndTime ? (
              <button
                type="button"
                onClick={clearEndTime}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove end time
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowEndTime(true)
                  setValue("endDate", watch("startDate"))
                  setValue("endHour", watch("startHour"))
                  setValue("endMinute", watch("startMinute"))
                  setValue("endPeriod", watch("startPeriod"))
                }}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Add end time
              </button>
            )}
          </div>

          {showEndTime && (
            <div className="space-y-2">
              <CalendarInput
                label="End date"
                value={watch("endDate") || watch("startDate")}
                onSelect={(val) => setValue("endDate", val)}
              />
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className="rounded border border-gray-300 bg-white p-2 text-center"
                    inputMode="numeric"
                    placeholder="HH"
                    list="hour-wheel"
                    {...register("endHour")}
                  />
                  <input
                    className="rounded border border-gray-300 bg-white p-2 text-center"
                    inputMode="numeric"
                    placeholder="MM"
                    list="minute-wheel"
                    {...register("endMinute")}
                  />
                  <select
                    className="rounded border border-gray-300 bg-white p-2 text-center"
                    {...register("endPeriod")}
                  >
                    <option value="">--</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-700">Quick minutes:</span>
                  {minuteOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setValue("endMinute", m)}
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
                    >
                      :{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-600">
            If you leave this blank, we&apos;ll assume roughly two hours after the start.
          </div>
        </div>
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

      <datalist id="hour-wheel">
        {hourOptions.map((h) => (
          <option key={h} value={h.padStart(2, "0")}>
            {h.padStart(2, "0")}
          </option>
        ))}
      </datalist>
      <datalist id="minute-wheel">
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </datalist>
    </form>
  )
}
