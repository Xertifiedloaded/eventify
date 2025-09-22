import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { qrData, eventId } = await request.json()

    console.log("[v0] QR verification request:", { qrData, eventId })

    let registrationId: string | null = null

    try {
      // Try JSON format first
      const parsed = JSON.parse(qrData)
      registrationId = parsed.id || parsed.registrationId
      console.log("[v0] Parsed JSON QR data:", parsed)
    } catch {
      // Try URL format
      if (qrData.includes("/verify/")) {
        const parts = qrData.split("/")
        registrationId = parts[parts.length - 1]
        console.log("[v0] Extracted from URL:", registrationId)
      }
      // Try direct UUID format
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrData.trim())) {
        registrationId = qrData.trim()
        console.log("[v0] Direct UUID format:", registrationId)
      }
      // Try colon-separated format
      else if (qrData.includes(":")) {
        const parts = qrData.split(":")
        registrationId = parts[parts.length - 1]
        console.log("[v0] Extracted from colon format:", registrationId)
      }
    }

    if (!registrationId) {
      console.log("[v0] Could not extract registration ID from QR data")
      return NextResponse.json(
        {
          error: "Invalid QR code format",
          debug: `Could not parse: ${qrData}`,
        },
        { status: 400 },
      )
    }

    // Find the registration
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId: eventId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        event: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!registration) {
      console.log("[v0] Registration not found:", { registrationId, eventId })
      return NextResponse.json(
        {
          error: "Registration not found for this event",
          debug: `ID: ${registrationId}, Event: ${eventId}`,
        },
        { status: 404 },
      )
    }

    // Check if already verified
    if (registration.verified) {
      console.log("[v0] Registration already verified:", registration.name)
      return NextResponse.json({
        registration,
        message: `${registration.name} is already checked in`,
        alreadyVerified: true,
      })
    }

    // Mark as verified
    const updatedRegistration = await prisma.registration.update({
      where: { id: registrationId },
      data: { verified: true },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
      },
    })

    console.log("[v0] Registration verified successfully:", updatedRegistration.name)

    return NextResponse.json({
      registration: updatedRegistration,
      message: `${updatedRegistration.name} verified successfully`,
    })
  } catch (error) {
    console.error("[v0] QR verification error:", error)
    return NextResponse.json(
      {
        error: "Verification failed",
        debug: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
