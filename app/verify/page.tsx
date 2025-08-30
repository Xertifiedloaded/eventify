"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, QrCode, Calendar, ArrowLeft, Scan } from "lucide-react"
import QRScanner from "@/components/qr-scanner"


export default function VerifyTicketPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)

  const handleScanResult = (result: string) => {
    try {
      console.log("QR Code scanned:", result)
      
      // Parse QR code result - expecting format like: 
      // https://yourapp.com/verify/eventId/registrationId
      // or just: eventId/registrationId
      
      let eventId: string
      let registrationId: string

      if (result.includes('/verify/')) {
        // Full URL format
        const urlParts = result.split('/verify/')[1].split('/')
        eventId = urlParts[0]
        registrationId = urlParts[1]
      } else if (result.includes('/')) {
        // Simple format: eventId/registrationId
        const parts = result.split('/')
        if (parts.length >= 2) {
          eventId = parts[parts.length - 2]
          registrationId = parts[parts.length - 1]
        } else {
          throw new Error('Invalid QR code format')
        }
      } else {
        throw new Error('Invalid QR code format')
      }

      if (!eventId || !registrationId) {
        throw new Error('Missing event or registration ID')
      }

      // Navigate to verification result page
      window.location.href = `/verify/${eventId}/${registrationId}`
      
    } catch (error) {
      console.error('Error parsing QR code:', error)
      alert('Invalid QR code format. Please scan a valid ticket QR code.')
      setShowScanner(false)
      setScanning(false)
    }
  }

  const handleScanError = (error: string) => {
    console.error('Scan error:', error)
    setShowScanner(false)
    setScanning(false)
  }

  if (showScanner) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 bg-card border-b">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setShowScanner(false)
                setScanning(false)
              }}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Scan Ticket</h1>
            <div className="w-9" /> 
          </div>
        </div>
        
        <QRScanner
          onResult={handleScanResult}
          onError={handleScanError}
          scanning={scanning}
        />
        
        <div className="p-6 text-center bg-card/50">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Point your camera at the QR code on the ticket
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <Scan className="h-4 w-4" />
              <span>Make sure the QR code is clearly visible and well-lit</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Ticket Verification</h1>
          <p className="text-muted-foreground mt-2">
            Scan QR codes to verify event registrations
          </p>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4 mx-auto">
              <QrCode className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">Ready to Scan</CardTitle>
            <CardDescription>
              Tap the button below to start scanning tickets
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              onClick={() => {
                setShowScanner(true)
                setScanning(true)
              }}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Scanning
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                This will request camera permission
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <span>• Works on mobile & desktop</span>
                <span>• Secure verification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-medium">Need help?</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Make sure QR code is well-lit</p>
                <p>• Hold camera steady</p>
                <p>• QR code should fill the scanning area</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Link href="/events">
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}