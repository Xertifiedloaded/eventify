import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const totalEvents = await prisma.event.count()
    const activeEvents = await prisma.event.count({
      where: { status: "ACTIVE" },
    })
    const totalRegistrations = await prisma.registration.count()
    const verifiedRegistrations = await prisma.registration.count({
      where: { verified: true },
    })

    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        date: true,
        _count: {
          select: { registrations: true },
        },
      },
    })

    return NextResponse.json({
      totalEvents,
      activeEvents,
      totalRegistrations,
      verifiedRegistrations,
      unverifiedRegistrations: totalRegistrations - verifiedRegistrations,
      recentEvents,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
