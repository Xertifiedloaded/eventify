// components/QRCodeGenerator.tsx
"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { QrCode, Download, Share2 } from "lucide-react"

interface QRCodeGeneratorProps {
  data: string | object
  size?: number
  filename?: string
  className?: string
}

export default function QRCodeGenerator({ 
  data, 
  size = 256, 
  filename = "qr-code", 
  className = "" 
}: QRCodeGeneratorProps) {
  const [qrDataURL, setQrDataURL] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    generateQRCode()
  }, [data, size])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError("")
      
      const qrData = typeof data === 'string' ? data : JSON.stringify(data)
      
      const dataURL = await QRCode.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })

      setQrDataURL(dataURL)
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      setError("Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrDataURL) return

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = qrDataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareQR = async () => {
    if (!qrDataURL) return

    try {
      const response = await fetch(qrDataURL)
      const blob = await response.blob()
      const file = new File([blob], `${filename}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'QR Code',
          files: [file]
        })
      } else {
        downloadQR()
      }
    } catch (error) {
      downloadQR()
    }
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="animate-pulse bg-muted rounded-lg" style={{ width: size, height: size }}>
          <div className="flex items-center justify-center h-full">
            <QrCode className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Generating QR code...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="bg-muted rounded-lg flex items-center justify-center" style={{ width: size, height: size }}>
          <QrCode className="h-12 w-12 text-muted-foreground" />
        </div>
        <p className="text-sm text-destructive mt-2">{error}</p>
        <Button onClick={generateQRCode} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <img src={qrDataURL} alt="QR Code" style={{ width: size, height: size }} />
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={downloadQR} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={shareQR} variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  )
}