import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    const eventId = params.id

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

    // Get all registrations for this event
    const registrations = await prisma.registration.findMany({
      where: {
        eventId: eventId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error("Failed to fetch registrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
