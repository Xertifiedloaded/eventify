"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle, Mail, QrCode, ArrowLeft } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"  

interface Registration {
  id: string
  name: string
  email: string
  qrCode: string
  event: {
    title: string
    date: string
    time: string
    location: string
    slug: string
  }
}

export default function RegistrationSuccessPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get("id")
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    } else {
      setError("Registration ID not found")
      setLoading(false)
    }
  }, [registrationId])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/public/registrations/${registrationId}`)
      if (response.ok) {
        const data = await response.json()
        setRegistration(data.registration)
      } else {
        setError("Registration not found")
      }
    } catch (error) {
      setError("Failed to load registration details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading registration details...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
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
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Registration Not Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn't find your registration details. Please try registering again.
          </p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ✅ Encode full registration details inside QR code
  const qrValue = JSON.stringify({
    id: registration.id,
    name: registration.name,
    email: registration.email,
    event: registration.event,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/events/${registration.event.slug}`}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Event</span>
          </Link>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="font-semibold text-foreground">Registration Complete</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Registration Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for registering, {registration.name}. You're all set for the event!
          </p>
        </div>

        {/* Event Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-balance">{registration.event.title}</CardTitle>
            <CardDescription>
              {new Date(registration.event.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at {registration.event.time}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {registration.event.location}
            </p>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Your Entry QR Code
            </CardTitle>
            <CardDescription>
              Present this QR code at the event for entry verification
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
              <QRCodeCanvas
                value={qrValue}   // ✅ full registration details
                size={192}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Save this QR code to your phone or print it out to bring to the event
            </p>
          </CardContent>
        </Card>

        {/* Email Confirmation */}
        <Alert className="mb-6">
          <Mail className="h-4 w-4" />
          <AlertDescription>
            A confirmation email with your QR code has been sent to <strong>{registration.email}</strong>. Please check
            your inbox and spam folder.
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  1
                </span>
                <span>Save your QR code to your phone or print it out</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  2
                </span>
                <span>Arrive at the event location on time</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  3
                </span>
                <span>Present your QR code to the organizer for verification</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/events/${registration.event.slug}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              View Event Details
            </Button>
          </Link>
          <Link href="/events" className="flex-1">
            <Button className="w-full">Browse More Events</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
