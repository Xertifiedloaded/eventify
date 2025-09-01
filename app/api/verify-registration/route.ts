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

    let registrationId: string

    // Enhanced QR data parsing with better error handling
    console.log("Raw QR Data:", qrData) // Debug log

    try {
      // Method 1: Try parsing as JSON
      const registrationData = JSON.parse(qrData)
      console.log("Parsed JSON:", registrationData) // Debug log
      
      // Look for registration ID in various possible fields
      registrationId = registrationData.registrationId || 
                      registrationData.id || 
                      registrationData.regId ||
                      registrationData.registration_id

      if (!registrationId) {
        throw new Error("No registration ID found in JSON structure")
      }
    } catch (jsonError) {
      console.log("JSON parse failed, trying other methods:", jsonError)
      
      // Method 2: Check if it's a direct URL format
      if (qrData.includes("/verify/")) {
        const parts = qrData.split("/")
        registrationId = parts[parts.length - 1]
      } 
      // Method 3: Check if it's a formatted string like "eventId:registrationId"
      else if (qrData.includes(":")) {
        const parts = qrData.split(":")
        registrationId = parts[parts.length - 1] // Take the last part as registration ID
      }
      // Method 4: Check if it looks like a UUID (contains hyphens)
      else if (qrData.includes("-") && qrData.length >= 32) {
        registrationId = qrData.trim()
      }
      // Method 5: Try to extract UUID pattern from string
      else {
        const uuidMatch = qrData.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
        if (uuidMatch) {
          registrationId = uuidMatch[0]
        } else {
          return NextResponse.json({ 
            error: "Invalid QR code format. Could not extract registration ID.",
            debug: `Received: ${qrData}` 
          }, { status: 400 })
        }
      }
    }

    console.log("Extracted Registration ID:", registrationId) // Debug log

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
      return NextResponse.json({ 
        error: "Registration not found for this event",
        debug: `Looking for registration ID: ${registrationId} in event: ${eventId}`
      }, { status: 404 })
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