import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params

    // First verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        verified: true,
        createdAt: true,
        qrCode: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
