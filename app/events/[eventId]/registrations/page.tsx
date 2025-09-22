"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Users,
  ArrowLeft,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  Download,
  Scan,
  MapPin,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import QRScanner from "@/components/qr-scanner"

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
}

interface Registration {
  id: string
  name: string
  email: string
  phone: string | null
  location: string
  verified: boolean
  createdAt: string
  qrCode: string
}

export default function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [eventLoading, setEventLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
  })

  useEffect(() => {
    if (user) {
      fetchEvent()
      fetchRegistrations()
    }
  }, [user, id])

  useEffect(() => {
    if (searchTerm) {
      const filtered = registrations.filter(
        (reg) =>
          reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredRegistrations(filtered)
    } else {
      setFilteredRegistrations(registrations)
    }
  }, [searchTerm, registrations])

  useEffect(() => {
    const total = registrations.length
    const verified = registrations.filter((reg) => reg.verified).length
    const unverified = total - verified
    setStats({ total, verified, unverified })
  }, [registrations])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setEventLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/events/${id}/registrations`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations)
        setFilteredRegistrations(data.registrations)
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error)
    }
  }

  const handleQRScan = async (qrData: string) => {
    try {
      console.log("QR Data received:", qrData)

      setVerificationMessage("🔄 Processing QR code...")

      const response = await fetch("/api/verify-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ qrData: qrData.trim(), eventId: id }),
      })

      const data = await response.json()
      console.log("Verification response:", data) // Debug log

      if (response.ok) {
        // Success - show detailed message
        const wasAlreadyVerified = data.message?.includes("already")
        const icon = wasAlreadyVerified ? "ℹ️" : "✅"
        const status = wasAlreadyVerified ? "already checked in" : "verified successfully"

        setVerificationMessage(`${icon} ${data.registration.name} ${status}!`)

        // Play success sound if available
        try {
          const audio = new Audio("/sounds/success.mp3") // Optional: add success sound
          audio.play().catch(() => {}) // Ignore if sound fails
        } catch {}

        // Refresh the list to show updated status
        fetchRegistrations()
      } else {
        // Error - show specific error message
        setVerificationMessage(`❌ ${data.error || "Verification failed"}`)

        // Additional debug info in development
        if (process.env.NODE_ENV === "development" && data.debug) {
          console.error("Verification debug info:", data.debug)
          setVerificationMessage((prev) => `${prev}\nDebug: ${data.debug}`)
        }
      }
    } catch (error) {
      console.error("QR scan error:", error)
      setVerificationMessage("❌ Network error. Please check your connection and try again.")
    }

    // Clear message after 5 seconds (increased from 3 for better UX)
    setTimeout(() => setVerificationMessage(""), 5000)
  }

  // Optional: Add this helper function to validate QR data before sending
  const validateQRData = (qrData: string): { isValid: boolean; extractedId?: string; format?: string } => {
    try {
      // Try JSON format
      const parsed = JSON.parse(qrData)
      if (parsed.id || parsed.registrationId) {
        return {
          isValid: true,
          extractedId: parsed.id || parsed.registrationId,
          format: "json",
        }
      }
    } catch {}

    // Try URL format
    if (qrData.includes("/verify/")) {
      const parts = qrData.split("/")
      const id = parts[parts.length - 1]
      if (id && id.length > 10) {
        return { isValid: true, extractedId: id, format: "url" }
      }
    }

    // Try direct UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidPattern.test(qrData.trim())) {
      return { isValid: true, extractedId: qrData.trim(), format: "uuid" }
    }

    // Try colon-separated format (eventId:registrationId)
    if (qrData.includes(":")) {
      const parts = qrData.split(":")
      const id = parts[parts.length - 1]
      if (id && id.length > 10) {
        return { isValid: true, extractedId: id, format: "colon-separated" }
      }
    }

    return { isValid: false }
  }

  // Enhanced version with pre-validation
  const handleQRScanWithValidation = async (qrData: string) => {
    try {
      console.log("QR Data received:", qrData)

      // Validate QR data format first
      const validation = validateQRData(qrData)

      if (!validation.isValid) {
        setVerificationMessage("❌ Invalid QR code format. Please try scanning again.")
        console.warn("Invalid QR format:", qrData)
        return
      }

      console.log(`Valid QR detected (${validation.format}):`, validation.extractedId)
      setVerificationMessage("🔄 Verifying registration...")

      const response = await fetch("/api/verify-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ qrData: qrData.trim(), eventId: id }),
      })

      const data = await response.json()

      if (response.ok) {
        const wasAlreadyVerified = data.message?.includes("already")
        const icon = wasAlreadyVerified ? "ℹ️" : "✅"
        const status = wasAlreadyVerified ? "already checked in" : "verified successfully"

        setVerificationMessage(`${icon} ${data.registration.name} ${status}!`)
        fetchRegistrations()

        // Vibrate on mobile if supported
        if (navigator.vibrate) {
          navigator.vibrate(wasAlreadyVerified ? [100] : [100, 50, 100])
        }
      } else {
        setVerificationMessage(`❌ ${data.error || "Verification failed"}`)
      }
    } catch (error) {
      console.error("QR scan error:", error)
      setVerificationMessage("❌ Network error. Please try again.")
    }

    setTimeout(() => setVerificationMessage(""), 5000)
  }

  const toggleVerification = async (registrationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ verified: !currentStatus }),
      })

      if (response.ok) {
        fetchRegistrations() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update verification status:", error)
    }
  }

  const exportRegistrations = () => {
    if (typeof window === "undefined") return

    const csvContent = [
      ["Name", "Email", "Phone", "Location", "Verified", "Registration Date"].join(","),
      ...registrations.map((reg) =>
        [
          reg.name,
          reg.email,
          reg.phone || "",
          reg.location,
          reg.verified ? "Yes" : "No",
          format(new Date(reg.createdAt), "yyyy-MM-dd HH:mm"),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${event?.title || "event"}-registrations.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading || eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!user || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The event you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
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
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Event Registrations</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Event Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-balance">{event.title}</CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(event.date), "PPP")}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {event.time}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.location}
                    </span>
                  </div>
                </CardDescription>
              </div>
              <Badge
                className={
                  event.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : event.status === "ENDED"
                      ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                }
              >
                {event.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              {event.maxAttendees && (
                <p className="text-xs text-muted-foreground">of {event.maxAttendees} max capacity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Attendees</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unverified}</div>
              <p className="text-xs text-muted-foreground">awaiting check-in</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Message */}
        {verificationMessage && (
          <Alert className="mb-6">
            <AlertDescription>{verificationMessage}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={exportRegistrations} variant="outline" className="bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Registrations List */}
            {filteredRegistrations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchTerm ? "No registrations found" : "No registrations yet"}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Registrations will appear here as people sign up for your event."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((registration) => (
                  <Card key={registration.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{registration.name}</h3>
                            <Badge
                              variant={registration.verified ? "default" : "secondary"}
                              className={
                                registration.verified
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                              }
                            >
                              {registration.verified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{registration.email}</p>
                            {registration.phone && <p>{registration.phone}</p>}
                            <p>{registration.location}</p>
                            <p>Registered: {format(new Date(registration.createdAt), "PPp")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={registration.verified ? "outline" : "default"}
                            onClick={() => toggleVerification(registration.id, registration.verified)}
                            className={registration.verified ? "bg-transparent" : ""}
                          >
                            {registration.verified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark Unverified
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Verified
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scanner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Scan attendee QR codes to verify their registration and mark them as checked in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowScanner(!showScanner)}
                    className="w-full sm:w-auto"
                    variant={showScanner ? "outline" : "default"}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    {showScanner ? "Stop Scanner" : "Start Scanner"}
                  </Button>

                  {showScanner && (
                    <div className="border border-border rounded-lg p-4">
                      <QRScanner onScan={handleQRScan} />
                    </div>
                  )}

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">How to use the scanner:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Click "Start Scanner" to activate your camera</li>
                      <li>• Point your camera at the attendee's QR code</li>
                      <li>• The system will automatically verify and check them in</li>
                      <li>• You'll see a confirmation message for each successful scan</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
