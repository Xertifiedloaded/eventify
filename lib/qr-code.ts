import QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"

/**
 * Generate a unique QR code ID
 */
export function generateUniqueQRId(): string {
  return uuidv4()
}

/**
 * Generate standardized QR code data for event registration
 * This creates a consistent format that can be easily parsed by scanners
 */
export function generateQRCodeData(eventId: string, registrationId: string): string {
  // Create a standardized JSON format for QR codes
  const qrData = {
    type: "event_registration",
    eventId,
    registrationId,
    timestamp: Date.now(),
    version: "1.0",
  }

  return JSON.stringify(qrData)
}

/**
 * Generate QR code image as base64 data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H", // High error correction for better scanning
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256, // Good size for scanning
    })

    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

/**
 * Parse QR code data and extract registration information
 */
export function parseQRCodeData(qrData: string): { eventId: string; registrationId: string } | null {
  try {
    // Try to parse as JSON first (new standardized format)
    const parsed = JSON.parse(qrData)

    if (parsed.type === "event_registration" && parsed.eventId && parsed.registrationId) {
      return {
        eventId: parsed.eventId,
        registrationId: parsed.registrationId,
      }
    }

    // Fallback: try to extract from legacy formats
    if (parsed.registrationId || parsed.id) {
      return {
        eventId: parsed.eventId || "",
        registrationId: parsed.registrationId || parsed.id,
      }
    }

    throw new Error("Invalid QR code format")
  } catch (jsonError) {
    // Handle non-JSON formats (legacy support)
    console.log("QR data is not JSON, trying legacy parsing:", qrData)

    // Method 1: URL format like "/verify/eventId/registrationId"
    if (qrData.includes("/verify/")) {
      const parts = qrData.split("/")
      const registrationId = parts[parts.length - 1]
      const eventId = parts[parts.length - 2]
      if (registrationId && eventId) {
        return { eventId, registrationId }
      }
    }

    // Method 2: Colon-separated format like "eventId:registrationId"
    if (qrData.includes(":")) {
      const parts = qrData.split(":")
      if (parts.length === 2) {
        return { eventId: parts[0], registrationId: parts[1] }
      }
    }

    // Method 3: UUID pattern extraction
    const uuidMatch = qrData.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    if (uuidMatch) {
      return { eventId: "", registrationId: uuidMatch[0] }
    }

    return null
  }
}
