import { BadRequestException } from '@nestjs/common';

/**
 * `/mistral/image-url` forwards a caller-supplied URL to be fetched off our
 * infrastructure. Restrict it to public http(s) endpoints so it can't be
 * pointed at localhost, the Docker network, or a cloud metadata service.
 */

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);

// IPv4 ranges that must never be reachable through this endpoint.
const BLOCKED_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./, // link-local + AWS/GCP/Azure metadata (169.254.169.254)
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64.0.0/10
];

export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BadRequestException('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException('Only http(s) URLs are allowed');
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost')) {
    throw new BadRequestException('URL host is not allowed');
  }

  // Literal IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    if (BLOCKED_V4.some((re) => re.test(host))) {
      throw new BadRequestException('URL host is not allowed');
    }
  }

  // Any IPv6 literal: block loopback (::1), unique-local (fc00::/7) and
  // link-local (fe80::/10); allow nothing else IPv6 to keep it simple.
  if (host.includes(':')) {
    if (
      host === '::1' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe8') ||
      host.startsWith('fe9') ||
      host.startsWith('fea') ||
      host.startsWith('feb') ||
      host.startsWith('::ffff:')
    ) {
      throw new BadRequestException('URL host is not allowed');
    }
  }

  return url;
}
