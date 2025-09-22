"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle } from "lucide-react"
import QrScanner from "qr-scanner"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  isScanning?: boolean
  className?: string
}

const QRScanner = ({ onScan, onError, isScanning = false, className }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string>("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<QrScanner | null>(null)

  const startScanning = async () => {
    try {
      setError("")
      setIsLoading(true)

      // Check if QR Scanner has camera support
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        throw new Error("No camera available on this device")
      }

      // Wait a bit for the video element to be ready
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!videoRef.current) {
        throw new Error("Video element not found")
      }

      // Create QR Scanner instance first
      const scanner = new QrScanner(
        videoRef.current,
        (result: any) => {
          console.log("QR Code detected:", result.data)
          onScan(result.data)
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera if available
          maxScansPerSecond: 5,
        }
      )

      scannerRef.current = scanner
      
      // Start the scanner
      await scanner.start()
      
      setHasPermission(true)
      setIsActive(true)
      setIsLoading(false)

    } catch (err: any) {
      console.error("Error starting camera:", err)
      setHasPermission(false)
      setIsActive(false)
      setIsLoading(false)

      let errorMessage = "Failed to access camera. "
      
      if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
        errorMessage += "Please allow camera access and try again."
      } else if (err.name === "NotFoundError" || err.message?.includes("No camera")) {
        errorMessage += "No camera found on this device."
      } else if (err.name === "NotSupportedError") {
        errorMessage += "Camera is not supported on this device or browser."
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is being used by another application."
      } else if (err.message?.includes("secure")) {
        errorMessage += "Camera access requires HTTPS connection."
      } else {
        errorMessage += `Error: ${err.message || "Unknown camera error"}`
      }

      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
      setIsActive(false)
      setError("")
      setIsLoading(false)
    } catch (err) {
      console.error("Error stopping scanner:", err)
    }
  }

  // Check camera permissions on mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        const hasCamera = await QrScanner.hasCamera()
        if (!hasCamera) {
          setError("No camera available on this device")
          setHasPermission(false)
        }
      } catch (err) {
        console.error("Error checking camera support:", err)
      }
    }

    checkCameraSupport()

    // Cleanup on unmount
    return () => stopScanning()
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>Point your camera at a QR code to scan it automatically</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasPermission === false && !error && (
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan QR codes. Please allow camera access in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg object-cover"
            playsInline
            muted
            autoPlay
            style={{ 
              transform: 'scaleX(-1)', // Mirror the video for better UX
            }}
          />

          {isActive ? (
            <>
              {/* Square scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary relative opacity-80">
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-pulse"></div>
                </div>
              </div>

              {(isScanning || isLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="bg-background/90 px-4 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 animate-pulse" />
                    <span className="text-sm font-medium">
                      {isLoading ? "Starting camera..." : "Processing..."}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {isLoading ? "Starting camera..." : "Camera not active"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isActive ? (
            <Button 
              onClick={startScanning} 
              className="flex-1"
              disabled={isLoading || hasPermission === false}
            >
              <Camera className="h-4 w-4 mr-2" />
              {isLoading ? "Starting..." : "Start Scanning"}
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="flex-1">
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Point your camera at a QR code</p>
          <p>• Make sure the QR code is well-lit and in focus</p>
          <p>• The scanner will automatically detect and process the code</p>
          {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
            <p className="text-orange-600">• Camera requires HTTPS connection</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { QRScanner }
export default QRScanner