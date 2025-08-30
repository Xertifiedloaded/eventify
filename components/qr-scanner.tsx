"use client"

import type React from "react"
import jsQR from "jsqr"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Type, CheckCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanStatus, setScanStatus] = useState("Initializing camera...")

  useEffect(() => {
    if (!showManualInput) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [showManualInput])

  const startCamera = async () => {
    try {
      setError("")
      setScanStatus("Requesting camera access...")
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsScanning(true)
        setScanStatus("Camera ready - Point at QR code")

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          startScanning()
        }
      }
    } catch (err) {
      console.error("Camera error:", err)
      setError("Camera access denied or not available. Please use manual input instead.")
      setScanStatus("Camera unavailable")
      setShowManualInput(true)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
  }

  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 100) // Scan every 100ms
  }

  const scanQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      // Use jsQR to detect QR codes
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert", // Performance optimization
      })

      if (qrCode) {
        setScanStatus("QR Code detected!")
        console.log("QR Code found:", qrCode.data)
        
        // Stop scanning and call the onScan callback
        stopCamera()
        onScan(qrCode.data)
      } else {
        setScanStatus("Scanning... Point camera at QR code")
      }
    } catch (err) {
      console.error("QR scanning error:", err)
      setScanStatus("Scanning error - trying again...")
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput("")
    }
  }

  const toggleInputMethod = () => {
    if (showManualInput) {
      // Switching to camera
      setShowManualInput(false)
      startCamera()
    } else {
      // Switching to manual
      stopCamera()
      setShowManualInput(true)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {error && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Camera View */}
      {!showManualInput && (
        <div className="relative">
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              style={{ aspectRatio: "4/3" }}
            />
            
            {/* QR Code Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse"></div>
                  {/* Corner brackets for better UX */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Status indicator */}
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">{scanStatus}</p>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Manual Input Toggle */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={toggleInputMethod}
          className="bg-background"
        >
          {showManualInput ? (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Use Camera Scanner
            </>
          ) : (
            <>
              <Type className="h-4 w-4 mr-2" />
              Manual Input
            </>
          )}
        </Button>
      </div>

      {/* Manual Input Form */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qrInput">Enter QR Code Data</Label>
            <Input
              id="qrInput"
              type="text"
              placeholder="Paste or type QR code data here"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" disabled={!manualInput.trim()} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Verify Registration
          </Button>
        </form>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        {showManualInput
          ? "Paste the QR code data or registration code to verify"
          : isScanning
          ? "Hold steady and point your camera at the QR code"
          : "Initializing camera..."}
      </div>
    </div>
  )
}