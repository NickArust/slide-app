import { PrismaClient, UserRole } from "@prisma/client"

const SAMPLE_EVENTS = [
  { title: "Downtown Mixer", category: "Networking", address: "Church St Station, Orlando, FL" },
  { title: "Sunset Sets", category: "Live Music", address: "Lake Eola Park, Orlando, FL" },
  { title: "Late Night Bites", category: "Food & Drink", address: "Milk District, Orlando, FL" },
  { title: "College Night", category: "Students", address: "UCF Main Campus, Orlando, FL" },
  { title: "Craft Beer Crawl", category: "Bars", address: "Ivanhoe Village, Orlando, FL" },
  { title: "Yoga in the Park", category: "Wellness", address: "Blue Jacket Park, Orlando, FL" },
  { title: "Indie Film Meetup", category: "Film", address: "Enzian Theater, Maitland, FL" },
  { title: "Board Game Social", category: "Community", address: "East End Market, Orlando, FL" },
]

export async function ensureSampleEvents(prisma: PrismaClient) {
  // Only seed once per environment; avoid piling duplicates.
  const existing = await prisma.event.count()
  if (existing >= SAMPLE_EVENTS.length) return

  const promoter = await prisma.user.upsert({
    where: { email: "promoter@example.com" },
    update: { role: UserRole.PROMOTER, username: "promoter" },
    create: {
      email: "promoter@example.com",
      name: "Blue Bar Promoter",
      username: "promoter",
      role: UserRole.PROMOTER,
      profile: { create: {} },
    },
  })

  const now = new Date()
  const baseStart = new Date(now.getTime() + 60 * 60 * 1000)
  const baseEnd = new Date(baseStart.getTime() + 3 * 60 * 60 * 1000)
  const coords = { lat: 28.5383, lng: -81.3792 }

  await Promise.all(
    SAMPLE_EVENTS.map((s, idx) =>
      prisma.event.create({
        data: {
          createdById: promoter.id,
          title: s.title,
          category: s.category,
          address: s.address,
          description: "Sample event",
          lat: coords.lat + (Math.random() - 0.5) * 0.04,
          lng: coords.lng + (Math.random() - 0.5) * 0.04,
          startsAt: new Date(baseStart.getTime() + idx * 45 * 60 * 1000),
          endsAt: new Date(baseEnd.getTime() + idx * 45 * 60 * 1000),
          is18Plus: idx % 2 === 0,
          is21Plus: idx % 3 === 0,
        },
      })
    )
  )
}
