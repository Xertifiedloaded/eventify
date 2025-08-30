import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    
    const event = await prisma.event.findUnique({
      where: {
        slug: slug,
      },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Failed to fetch event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}