import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const { qrData, eventId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!qrData || !eventId) {
      return NextResponse.json({ error: "QR data and event ID are required" }, { status: 400 })
    }

    // Verify the event belongs to the user
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: userId,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 })
    }

    // Parse QR data to extract registration ID
    // QR data format: /verify/{eventId}/{registrationId}
    let registrationId: string

    try {
      if (qrData.includes("/verify/")) {
        const parts = qrData.split("/")
        registrationId = parts[parts.length - 1]
      } else {
        // Assume the QR data is the registration ID directly
        registrationId = qrData
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    // Find the registration
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId: eventId,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found for this event" }, { status: 404 })
    }

    // Mark as verified
    const updatedRegistration = await prisma.registration.update({
      where: {
        id: registration.id,
      },
      data: {
        verified: true,
      },
    })

    return NextResponse.json({
      registration: {
        id: updatedRegistration.id,
        name: updatedRegistration.name,
        email: updatedRegistration.email,
        verified: updatedRegistration.verified,
      },
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
