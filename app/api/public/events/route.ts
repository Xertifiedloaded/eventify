import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: [
        {
          status: "asc", // ACTIVE events first
        },
        {
          date: "asc", // Then by date
        },
      ],
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Failed to fetch public events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
