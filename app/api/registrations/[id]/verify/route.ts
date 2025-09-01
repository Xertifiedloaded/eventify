import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    const { verified } = await request.json()
    const { id: registrationId } = await params // ✅ Fixed: await params

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the registration and verify the user owns the event
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        event: {
          organizerId: userId,
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found or unauthorized" }, { status: 404 })
    }

    // Update verification status
    const updatedRegistration = await prisma.registration.update({
      where: {
        id: registrationId,
      },
      data: {
        verified: verified,
      },
    })

    return NextResponse.json({
      registration: {
        id: updatedRegistration.id,
        verified: updatedRegistration.verified,
      },
    })
  } catch (error) {
    console.error("Failed to update verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}