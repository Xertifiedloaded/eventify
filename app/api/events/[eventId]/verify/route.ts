import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseQRCodeData } from "@/lib/qr-code" // Import the new parsing function

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

    console.log("Raw QR Data:", qrData)

    const parsedData = parseQRCodeData(qrData)

    if (!parsedData) {
      return NextResponse.json(
        {
          error: "Invalid QR code format. Could not extract registration ID.",
          debug: `Received: ${qrData}`,
        },
        { status: 400 },
      )
    }

    const { registrationId } = parsedData
    console.log("Extracted Registration ID:", registrationId)

    // Find the registration
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId: eventId,
      },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            time: true,
            location: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        {
          error: "Registration not found for this event",
          debug: `Looking for registration ID: ${registrationId} in event: ${eventId}`,
        },
        { status: 404 },
      )
    }

    // Check if already verified
    if (registration.verified) {
      return NextResponse.json({
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          verified: registration.verified,
        },
        message: "Attendee was already checked in",
      })
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
