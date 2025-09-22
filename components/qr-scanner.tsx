"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle } from "lucide-react"
import QrScanner from "qr-scanner" // ✅ static import works fine in Next.js client components

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  isScanning?: boolean
  className?: string
}

const QRScanner = ({ onScan, onError, isScanning = false, className }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string>("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const startScanning = async () => {
    try {
      setError("")

      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setStream(mediaStream)
      setHasPermission(true)
      setIsActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()

        // ✅ Create scanner instance
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
            preferredCamera: "environment",
          },
        )

        scannerRef.current = scanner
        await scanner.start()
      }
    } catch (err: any) {
      console.error("Error starting camera:", err)
      setHasPermission(false)
      setIsActive(false)

      let errorMessage = "Failed to access camera. "
      if (err.name === "NotAllowedError") {
        errorMessage += "Please allow camera access and try again."
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device."
      } else if (err.name === "NotSupportedError") {
        errorMessage += "Camera is not supported on this device."
      } else {
        errorMessage += "Please check your camera permissions."
      }

      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsActive(false)
    setError("")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
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

        {hasPermission === false && (
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan QR codes. Please allow camera access in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          {isActive ? (
            <div className="relative">
              <video ref={videoRef} className="w-full h-64 bg-black rounded-lg object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay */}
              <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-primary"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-primary"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-primary"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-primary"></div>
              </div>

              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="bg-background/90 px-4 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 animate-pulse" />
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="flex-1 bg-transparent">
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>• Point your camera at a QR code</p>
          <p>• Make sure the QR code is well-lit and in focus</p>
          <p>• The scanner will automatically detect and process the code</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { QRScanner }
export default QRScanner
