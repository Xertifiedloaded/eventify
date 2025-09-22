"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, XCircle, User, Mail } from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { parseQRCodeData } from "@/lib/qr-code"

interface Registration {
  id: string
  name: string
  email: string
  verified: boolean
}

interface Event {
  title: string
  date: string
  time: string
  location: string
  slug: string
}

interface VerificationResult {
  registration: Registration
  event?: Event
  message?: string
}

export default function ScanPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string>("")
  const [scanHistory, setScanHistory] = useState<VerificationResult[]>([])

  const handleScan = async (qrData: string) => {
    if (isScanning) return // Prevent multiple simultaneous scans

    setIsScanning(true)
    setError("")

    try {
      console.log("Scanned QR data:", qrData)

      // Parse the QR code data
      const parsedData = parseQRCodeData(qrData)

      if (!parsedData) {
        throw new Error("Invalid QR code format")
      }

      // Verify the registration
      const response = await fetch(`/api/events/${eventId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "current-user-id", // You'll need to get this from your auth system
        },
        body: JSON.stringify({
          qrData: qrData,
          eventId: eventId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setScanHistory((prev) => [data, ...prev.slice(0, 9)]) // Keep last 10 scans

        // Show success for a moment, then reset for next scan
        setTimeout(() => {
          setResult(null)
          setIsScanning(false)
        }, 3000)
      } else {
        throw new Error(data.error || "Verification failed")
      }
    } catch (err: any) {
      console.error("Scan error:", err)
      setError(err.message || "Failed to process QR code")
      setIsScanning(false)
    }
  }

  const handleScanError = (error: string) => {
    setError(error)
    setIsScanning(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/events/${eventId}`}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Event</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-foreground">QR Code Scanner</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner */}
          <div>
            <QRScanner onScan={handleScan} onError={handleScanError} isScanning={isScanning} />
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Current Scan Result */}
            {result && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-5 w-5" />
                    {result.registration.verified ? "Already Checked In" : "Check-in Successful"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{result.registration.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{result.registration.email}</span>
                  </div>
                  {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Scan History */}
            {scanHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Scans</CardTitle>
                  <CardDescription>Last {scanHistory.length} successful check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scanHistory.map((scan, index) => (
                      <div
                        key={`${scan.registration.id}-${index}`}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{scan.registration.name}</p>
                            <p className="text-xs text-muted-foreground">{scan.registration.email}</p>
                          </div>
                        </div>
                        <Badge variant={scan.registration.verified ? "secondary" : "default"}>
                          {scan.registration.verified ? "Re-scan" : "New"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Click "Start Scanning" to activate the camera</p>
                <p>• Point the camera at attendee QR codes</p>
                <p>• The system will automatically verify registrations</p>
                <p>• Green results indicate successful check-ins</p>
                <p>• Red alerts show errors or invalid codes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
