import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { verified } = await request.json()

    const registration = await prisma.registration.update({
      where: { id },
      data: { verified },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
      },
    })

    return NextResponse.json({
      registration,
      message: `Registration ${verified ? "verified" : "unverified"} successfully`,
    })
  } catch (error) {
    console.error("Error updating verification status:", error)
    return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 })
  }
}
