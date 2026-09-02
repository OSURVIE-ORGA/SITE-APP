/**
 * Content-sniffing for uploaded photos. The multer `fileFilter` only sees the
 * client-supplied MIME type, which is trivially spoofed — this checks the
 * actual leading bytes before anything is written to disk or sent to Mistral.
 */

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** Returns the real image MIME type from magic bytes, or null if unrecognised. */
export function sniffImageMime(buffer: Buffer): AllowedImageMime | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // HEIC/HEIF: ....'ftyp' then a heic/heif/mif1 brand
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (['heic', 'heix', 'heif', 'mif1', 'msf1'].includes(brand)) {
      return brand.startsWith('hei') ? 'image/heic' : 'image/heif';
    }
  }

  return null;
}

export function extensionForMime(mime: AllowedImageMime): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/heic':
      return '.heic';
    case 'image/heif':
      return '.heif';
  }
}

export const ALLOWED_DOC_MIME = [
  ...ALLOWED_IMAGE_MIME,
  'application/pdf',
] as const;

export type AllowedDocMime = (typeof ALLOWED_DOC_MIME)[number];

/**
 * Real MIME type of an uploaded document (image or PDF) from magic bytes, or
 * null if unrecognised. Backs POST /mistral/read-document.
 */
export function sniffDocMime(buffer: Buffer): AllowedDocMime | null {
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return 'application/pdf';
  }
  return sniffImageMime(buffer);
}
