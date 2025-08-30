import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {

    const { id } = await params
    
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            time: true,
            location: true,
            slug: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error("Failed to fetch registration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}