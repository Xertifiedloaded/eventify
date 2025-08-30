import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    const { id: eventId } = await params 

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the event belongs to the user
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Delete the event (registrations will be deleted due to cascade)
    await prisma.event.delete({
      where: {
        id: eventId,
      },
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Failed to delete event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    const { id: eventId } = await params // Await params before accessing properties

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Failed to fetch event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    const { id: eventId } = await params // Await params before accessing properties

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, date, time, location, status, maxAttendees } = await request.json()

    if (!title || !description || !date || !time || !location) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 })
    }

    // Verify the event belongs to the user
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId,
      },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        title,
        description,
        date: new Date(date),
        time,
        location,
        status,
        maxAttendees: maxAttendees || null,
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Failed to update event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}