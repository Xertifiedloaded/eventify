import QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"

export function generateQRCodeData(eventId: string, registrationId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/verify/${eventId}/${registrationId}`
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0891b2",
        light: "#ffffff",
      },
    })
  } catch (error) {
    throw new Error("Failed to generate QR code")
  }
}

export function generateUniqueQRId(): string {
  return uuidv4()
}
