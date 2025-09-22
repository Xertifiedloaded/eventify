import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        time: true,
        location: true,
        status: true,
        slug: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, date, time, location, maxAttendees } = body

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        location,
        slug,
        maxAttendees: maxAttendees || null,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
