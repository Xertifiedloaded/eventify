"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Users, MapPin, Clock, ArrowLeft, UserPlus } from "lucide-react"
import { format } from "date-fns"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  status: "ACTIVE" | "ENDED" | "CANCELLED"
  slug: string
  maxAttendees: number | null
  organizer: {
    name: string
    email: string
  }
  _count: {
    registrations: number
  }
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEvent()
  }, [slug])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/public/events/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      } else {
        setError("Event not found")
      }
    } catch (error) {
      setError("Failed to load event")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "ENDED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "ENDED":
        return "This event has ended."
      case "CANCELLED":
        return "This event has been cancelled."
      default:
        return null
    }
  }

  const isRegistrationOpen = event?.status === "ACTIVE"
  const isFull = event?.maxAttendees && event._count.registrations >= event.maxAttendees

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/events" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Events</span>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/events">
            <Button>Browse All Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/events" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Eventify</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">{event.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                <span className="text-sm text-muted-foreground">Organized by {event.organizer.name}</span>
              </div>
            </div>
            {isRegistrationOpen && !isFull && (
              <div className="flex-shrink-0">
                <Link href={`/events/${event.slug}/register`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {getStatusMessage(event.status) && (
            <Alert className="mb-6">
              <AlertDescription>{getStatusMessage(event.status)}</AlertDescription>
            </Alert>
          )}

          {isFull && isRegistrationOpen && (
            <Alert className="mb-6">
              <AlertDescription>This event is fully booked. Registration is no longer available.</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-pretty">{event.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
                  <div>
                    <p className="font-medium">{format(new Date(event.date), "PPPP")}</p>
                    <p className="text-sm text-muted-foreground">Date</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-muted-foreground mr-3" />
                  <div>
                    <p className="font-medium">{event.time}</p>
                    <p className="text-sm text-muted-foreground">Time</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-muted-foreground mr-3" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    <p className="text-sm text-muted-foreground">Location</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-3" />
                  <div>
                    <p className="font-medium">
                      {event._count.registrations}
                      {event.maxAttendees && ` / ${event.maxAttendees}`} registered
                    </p>
                    <p className="text-sm text-muted-foreground">Attendees</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent>
                {isRegistrationOpen && !isFull ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Join this event by registering below. You'll receive a QR code for entry.
                    </p>
                    <Link href={`/events/${event.slug}/register`}>
                      <Button className="w-full">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register for Event
                      </Button>
                    </Link>
                  </div>
                ) : isFull ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">This event is fully booked.</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Registration is not available for this event.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Card */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{event.organizer.name}</p>
                  <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
