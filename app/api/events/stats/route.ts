import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total events count
    const totalEvents = await prisma.event.count({
      where: {
        organizerId: userId,
      },
    })

    // Get active events count
    const activeEvents = await prisma.event.count({
      where: {
        organizerId: userId,
        status: "ACTIVE",
      },
    })

    // Get total registrations across all events
    const registrationsResult = await prisma.registration.aggregate({
      where: {
        event: {
          organizerId: userId,
        },
      },
      _count: {
        id: true,
      },
    })

    const totalRegistrations = registrationsResult._count.id

    return NextResponse.json({
      totalEvents,
      activeEvents,
      totalRegistrations,
    })
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
