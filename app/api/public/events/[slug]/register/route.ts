import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateQRCode, generateQRCodeData, generateUniqueQRId } from "@/lib/qr-code"

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { name, email, phone, location } = await request.json()

    if (!name || !email || !location) {
      return NextResponse.json({ error: "Name, email, and location are required" }, { status: 400 })
    }

    // Find the event
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if event is active
    if (event.status !== "ACTIVE") {
      return NextResponse.json({ error: "Registration is not available for this event" }, { status: 400 })
    }

    // Check if event is full
    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      return NextResponse.json({ error: "This event is fully booked" }, { status: 400 })
    }

    // Check if user already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        eventId_email: {
          eventId: event.id,
          email: email.toLowerCase(),
        },
      },
    })

    if (existingRegistration) {
      return NextResponse.json({ error: "You have already registered for this event" }, { status: 409 })
    }

    // Generate unique QR code ID
    const qrCodeId = generateUniqueQRId()

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        location,
        eventId: event.id,
        qrCode: qrCodeId,
      },
    })

    // Generate QR code data URL
    const qrCodeData = generateQRCodeData(event.id, registration.id)
    const qrCodeImage = await generateQRCode(qrCodeData)

    // Update registration with QR code image
    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: { qrCode: qrCodeImage },
    })

    return NextResponse.json({
      registration: {
        id: updatedRegistration.id,
        name: updatedRegistration.name,
        email: updatedRegistration.email,
        qrCode: updatedRegistration.qrCode,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
