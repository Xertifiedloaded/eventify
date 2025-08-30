"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, XCircle, MapPin, Clock } from "lucide-react"
import { format } from "date-fns"

interface VerificationData {
  registration: {
    id: string
    name: string
    email: string
    verified: boolean
  }
  event: {
    title: string
    date: string
    time: string
    location: string
    slug: string
  }
}

export default function VerificationPage({
  params,
}: {
  params: { eventId: string; registrationId: string }
}) {
  const [data, setData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchVerificationData()
  }, [params.eventId, params.registrationId])

  const fetchVerificationData = async () => {
    try {
      const response = await fetch(`/api/public/verify/${params.eventId}/${params.registrationId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError("Verification data not found")
      }
    } catch (error) {
      setError("Failed to load verification data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verifying registration...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
          <p className="text-muted-foreground mb-4">
            This registration could not be verified. Please check with the event organizer.
          </p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4 mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Registration Verified</CardTitle>
          <CardDescription>This attendee is registered for the event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">{data.registration.name}</h3>
            <p className="text-sm text-muted-foreground">{data.registration.email}</p>
            <Badge
              className={
                data.registration.verified
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mt-2"
                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 mt-2"
              }
            >
              {data.registration.verified ? "Already Checked In" : "Ready to Check In"}
            </Badge>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-foreground mb-2">{data.event.title}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(data.event.date), "PPP")}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {data.event.time}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {data.event.location}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link href={`/events/${data.event.slug}`}>
              <Button variant="outline" className="w-full bg-transparent">
                View Event Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
