import QRCode from 'qrcode';

/**
 * Generates a Base64 Data URL for a QR code.
 * Used for embedding QR codes into PDFs server-side.
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 200,
      color: {
        dark: '#0a0d0a', // Warriors Black
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return '';
  }
}
