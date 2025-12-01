import CreateEventForm from "@/components/CreateEventForm"

export default function CreatePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Event</h1>
      <p className="text-sm text-gray-600">Required: name, dates, location, and 18+/21+ tags.</p>
      <CreateEventForm />
    </div>
  )
}
