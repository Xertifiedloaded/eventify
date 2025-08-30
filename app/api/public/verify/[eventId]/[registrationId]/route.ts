import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { eventId: string; registrationId: string } }) {
  try {
    const registration = await prisma.registration.findFirst({
      where: {
        id: params.registrationId,
        eventId: params.eventId,
      },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            time: true,
            location: true,
            slug: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        verified: registration.verified,
      },
      event: registration.event,
    })
  } catch (error) {
    console.error("Failed to fetch verification data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
