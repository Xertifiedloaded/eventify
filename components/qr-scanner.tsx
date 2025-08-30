"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Type } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError("")
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsScanning(true)

        // Start scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          scanQRCode()
        }
      }
    } catch (err) {
      setError("Camera access denied or not available. Please use manual input instead.")
      setShowManualInput(true)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const scanQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet, try again
      setTimeout(scanQRCode, 100)
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

      // Simple QR code detection simulation
      // In a real implementation, you would use a QR code library like jsQR
      // For now, we'll simulate detection by checking for manual input

      // Continue scanning
      if (isScanning) {
        setTimeout(scanQRCode, 100)
      }
    } catch (err) {
      console.error("QR scanning error:", err)
      if (isScanning) {
        setTimeout(scanQRCode, 100)
      }
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput("")
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Camera View */}
      {!showManualInput && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md mx-auto rounded-lg border border-border"
            style={{ aspectRatio: "4/3" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse"></div>
            </div>
          )}
        </div>
      )}

      {/* Manual Input Toggle */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowManualInput(!showManualInput)}
          className="bg-transparent"
        >
          {showManualInput ? (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Use Camera
            </>
          ) : (
            <>
              <Type className="h-4 w-4 mr-2" />
              Manual Input
            </>
          )}
        </Button>
      </div>

      {/* Manual Input */}
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
            />
          </div>
          <Button type="submit" disabled={!manualInput.trim()}>
            Verify Registration
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground">
        {isScanning
          ? "Point your camera at a QR code to scan"
          : "Camera scanning is not available. Use manual input to verify registrations."}
      </div>
    </div>
  )
}
