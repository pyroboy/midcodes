import { nanoid, customAlphabet } from 'nanoid';

/**
 * Generates a QR code link for an attendee
 * @returns Promise<string> The QR code URL
 */
export async function generateQRCode(): Promise<string> {
    const randomString = Math.random().toString(36).substring(7);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(randomString)}`;
}

/**
 * Generates a tracking number in the format: EVNT-YYMM-XXXXX
 * where:
 * - EVNT: Fixed prefix for event
 * - YY: Current year (2 digits)
 * - MM: Current month (2 digits)
 * - XXXXX: Random alphanumeric sequence
 * @returns Promise<string> The reference code
 */
export async function generateReferenceCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Create custom nanoid with only uppercase letters and numbers
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);
    const randomPart = nanoid();

    return `EVNT-${year}${month}-${randomPart}`;
}
