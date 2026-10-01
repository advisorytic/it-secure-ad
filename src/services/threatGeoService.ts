import { Incident, SeverityLevel, IncidentStatus } from '../types/security';

export interface GeoThreatPoint {
  incidentId: string;
  incidentTitle: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  category: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  asn?: string;
  threatActor?: string;
  attackVector?: string;
  assetName: string;
  assetIp: string;
  timestamp: string;
  cveId?: string;
  cvssScore?: number;
  isInternalPivot?: boolean;
}

export interface TargetAssetLocation {
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  ip: string;
}

// Enterprise SOC datacenter target (Santo Domingo, Dominican Republic)
export const ENTERPRISE_SOC_TARGET: TargetAssetLocation = {
  name: 'Carioca Enterprise Datacenter HQ',
  city: 'Santo Domingo',
  country: 'República Dominicana',
  lat: 18.4861,
  lon: -69.9312,
  ip: '10.0.0.1 / 201.218.19.4',
};

// Known threat intelligence database for realistic IP resolution
const KNOWN_GEO_DATABASE: Record<
  string,
  {
    country: string;
    countryCode: string;
    city: string;
    lat: number;
    lon: number;
    asn: string;
    threatActor?: string;
  }
> = {
  '185.220.101.5': {
    country: 'Alemania',
    countryCode: 'DE',
    city: 'Fráncfort del Meno',
    lat: 50.1109,
    lon: 8.6821,
    asn: 'AS60729 Zwiebelfreunde (Tor Exit Node)',
    threatActor: 'TA505 / FIN7 Affiliate Relay',
  },
  '194.26.29.112': {
    country: 'Rusia',
    countryCode: 'RU',
    city: 'San Petersburgo',
    lat: 59.9311,
    lon: 30.3609,
    asn: 'AS49505 OOO Network / Bulletproof',
    threatActor: 'Sandworm / LockBit 3.0 C2',
  },
  '103.152.220.89': {
    country: 'Singapur',
    countryCode: 'SG',
    city: 'Singapur',
    lat: 1.3521,
    lon: 103.8198,
    asn: 'AS13335 Cloudflare AP Relay',
    threatActor: 'AnyDesk Shadow IT / Proxy Abuse',
  },
  '45.146.164.110': {
    country: 'Rumania',
    countryCode: 'RO',
    city: 'Bucarest',
    lat: 44.4268,
    lon: 26.1025,
    asn: 'AS20860 Hostinger International',
    threatActor: 'Shadowserver / Mass Automated Scanner',
  },
  '52.14.82.90': {
    country: 'Estados Unidos',
    countryCode: 'US',
    city: 'Columbus, Ohio',
    lat: 39.9612,
    lon: -82.9988,
    asn: 'AS16509 Amazon.com (AWS us-east-2)',
    threatActor: 'AWS Cloud Scanner / Probe',
  },
  '180.163.220.45': {
    country: 'China',
    countryCode: 'CN',
    city: 'Shanghái',
    lat: 31.2304,
    lon: 121.4737,
    asn: 'AS4812 China Telecom',
    threatActor: 'APT41 / Winnti Group',
  },
  '177.54.148.12': {
    country: 'Brasil',
    countryCode: 'BR',
    city: 'São Paulo',
    lat: -23.5505,
    lon: -46.6333,
    asn: 'AS28573 Claro Brasil Telecom',
    threatActor: 'Mirai IoT Botnet Operator',
  },
  '91.240.118.232': {
    country: 'Países Bajos',
    countryCode: 'NL',
    city: 'Ámsterdam',
    lat: 52.3676,
    lon: 4.9041,
    asn: 'AS44480 ITL LLC Bulletproof Hosting',
    threatActor: 'Cobalt Strike Team Server',
  },
  '185.191.171.18': {
    country: 'Reino Unido',
    countryCode: 'GB',
    city: 'Londres',
    lat: 51.5074,
    lon: -0.1278,
    asn: 'AS200000 Redstation Dedicated',
    threatActor: 'Proxy Mesh Brute Force Operator',
  },
  '196.216.144.18': {
    country: 'Sudáfrica',
    countryCode: 'ZA',
    city: 'Johannesburgo',
    lat: -26.2041,
    lon: 28.0473,
    asn: 'AS37100 Liquid Telecommunications',
    threatActor: 'NTP/DNS Amplification Vector',
  },
  '203.133.161.42': {
    country: 'Australia',
    countryCode: 'AU',
    city: 'Sídney',
    lat: -33.8688,
    lon: 151.2093,
    asn: 'AS4826 Vocus Group',
    threatActor: 'Commercial Penetration Testing IP',
  },
};

// Deterministic fallback list of global security observation hubs
const FALLBACK_LOCATIONS = [
  { country: 'Estados Unidos', countryCode: 'US', city: 'Ashburn, Virginia', lat: 39.0438, lon: -77.4874, asn: 'AS14618 Amazon Data Services' },
  { country: 'Alemania', countryCode: 'DE', city: 'Múnich', lat: 48.1351, lon: 11.582, asn: 'AS24940 Hetzner Online GmbH' },
  { country: 'Países Bajos', countryCode: 'NL', city: 'Róterdam', lat: 51.9244, lon: 4.4777, asn: 'AS1136 KPN B.V.' },
  { country: 'Francia', countryCode: 'FR', city: 'París', lat: 48.8566, lon: 2.3522, asn: 'AS16276 OVH SAS' },
  { country: 'Japón', countryCode: 'JP', city: 'Tokio', lat: 35.6762, lon: 139.6503, asn: 'AS2516 KDDI Corporation' },
  { country: 'Corea del Sur', countryCode: 'KR', city: 'Seúl', lat: 37.5665, lon: 126.978, asn: 'AS4766 Korea Telecom' },
  { country: 'Canadá', countryCode: 'CA', city: 'Montreal', lat: 45.5017, lon: -73.5673, asn: 'AS577 Bell Canada' },
  { country: 'España', countryCode: 'ES', city: 'Madrid', lat: 40.4168, lon: -3.7038, asn: 'AS3352 Telefónica de España' },
  { country: 'Polonia', countryCode: 'PL', city: 'Varsovia', lat: 52.2297, lon: 21.0122, asn: 'AS5617 Orange Polska' },
  { country: 'Colombia', countryCode: 'CO', city: 'Bogotá', lat: 4.711, lon: -74.0721, asn: 'AS3816 Colombia Telecomunicaciones' },
  { country: 'Chile', countryCode: 'CL', city: 'Santiago', lat: -33.4489, lon: -70.6693, asn: 'AS6428 Entel Chile' },
  { country: 'India', countryCode: 'IN', city: 'Bombay', lat: 19.076, lon: 72.8777, asn: 'AS55836 Reliance Jio Infocomm' },
];

/**
 * Check if an IP address is RFC1918 private / loopback
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim();
  if (clean.startsWith('10.') || clean.startsWith('192.168.') || clean.startsWith('127.')) {
    return true;
  }
  if (clean.startsWith('172.')) {
    const parts = clean.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }
  return false;
}

/**
 * Extract public IP or candidate threat origin from an incident
 */
export function extractCandidateIp(incident: Incident): string {
  // If explicitly assigned in incident
  if (incident.threatOriginIp && incident.threatOriginIp.trim()) {
    return incident.threatOriginIp.trim();
  }

  // Regex to look for IPv4 in description or title
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const text = `${incident.title} ${incident.description}`;
  const matches = text.match(ipRegex) || [];

  // Prefer first public IP found
  for (const m of matches) {
    if (!isPrivateIp(m)) {
      return m;
    }
  }

  // If only private IP found, or none, check for known sinkhole or asset
  if (matches.length > 0 && typeof matches[0] === 'string') {
    return matches[0];
  }

  return incident.assetIp || '185.220.101.5';
}

/**
 * Resolve IP to geographic telemetry
 */
export function resolveIpGeolocation(ip: string): {
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  asn: string;
  threatActor?: string;
  isInternalPivot: boolean;
} {
  const cleanIp = ip.trim();

  // 1. Direct match in curated threat database
  if (KNOWN_GEO_DATABASE[cleanIp]) {
    const record = KNOWN_GEO_DATABASE[cleanIp];
    return {
      country: record.country,
      countryCode: record.countryCode,
      city: record.city,
      lat: record.lat,
      lon: record.lon,
      asn: record.asn,
      threatActor: record.threatActor,
      isInternalPivot: false,
    };
  }

  // 2. Private IP: Treat as internal pivot with designated corporate proxy telemetry
  if (isPrivateIp(cleanIp)) {
    return {
      country: 'Red Corporativa Interna',
      countryCode: 'LAN',
      city: `Host Interno (${cleanIp})`,
      lat: 18.5200 + (Math.abs(hashString(cleanIp)) % 100) * 0.005,
      lon: -69.8800 - (Math.abs(hashString(cleanIp)) % 100) * 0.005,
      asn: 'AS-INTERNAL Enterprise Active Directory LAN',
      threatActor: 'Pivote Lateral / Compromiso de Estación',
      isInternalPivot: true,
    };
  }

  // 3. Fallback deterministic hash across realistic global SOC observation nodes
  const hash = Math.abs(hashString(cleanIp));
  const fallback = FALLBACK_LOCATIONS[hash % FALLBACK_LOCATIONS.length];

  // Minor jitter based on IP to spread out dots in the same city
  const jitterLat = ((hash % 100) - 50) * 0.015;
  const jitterLon = (((hash >> 2) % 100) - 50) * 0.015;

  return {
    country: fallback.country,
    countryCode: fallback.countryCode,
    city: fallback.city,
    lat: fallback.lat + jitterLat,
    lon: fallback.lon + jitterLon,
    asn: fallback.asn,
    threatActor: 'Actor de Amenaza No Clasificado',
    isInternalPivot: false,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Transforms an array of incidents into unified GeoThreatPoint items
 */
export function extractGeoThreatPoints(incidents: Incident[]): GeoThreatPoint[] {
  return incidents.map((inc) => {
    const ip = extractCandidateIp(inc);
    const geo = resolveIpGeolocation(ip);

    return {
      incidentId: inc.id,
      incidentTitle: inc.title,
      severity: inc.severity,
      status: inc.status,
      category: inc.category,
      ip: inc.threatOriginIp || ip,
      country: inc.threatOriginCountry || geo.country,
      countryCode: inc.threatOriginCountryCode || geo.countryCode,
      city: inc.threatOriginCity || geo.city,
      lat: inc.threatOriginLat !== undefined ? inc.threatOriginLat : geo.lat,
      lon: inc.threatOriginLon !== undefined ? inc.threatOriginLon : geo.lon,
      asn: inc.threatOriginAsn || geo.asn,
      threatActor: inc.threatActor || geo.threatActor,
      attackVector: inc.attackVector || inc.mitreTechnique || inc.category,
      assetName: inc.assetName,
      assetIp: inc.assetIp,
      timestamp: inc.createdAt,
      cveId: inc.cveId,
      cvssScore: inc.cvssScore,
      isInternalPivot: geo.isInternalPivot,
    };
  });
}

/**
 * Projects (lat, lon) to equirectangular SVG coordinates (viewBox 0 0 1000 500)
 */
export function geoToSvgCoords(
  lat: number,
  lon: number,
  viewBoxWidth = 1000,
  viewBoxHeight = 500
): { x: number; y: number } {
  // Clamped bounds
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const clampedLon = Math.max(-180, Math.min(180, lon));

  const x = ((clampedLon + 180) / 360) * viewBoxWidth;
  const y = ((90 - clampedLat) / 180) * viewBoxHeight;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Calculates a quadratic bezier ballistic attack arc from origin to target
 */
export function calculateAttackCurve(
  origin: { x: number; y: number },
  target: { x: number; y: number }
): { path: string; midPoint: { x: number; y: number } } {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Proportional curve arching upward
  const archHeight = Math.min(110, Math.max(25, dist * 0.22));
  const midX = (origin.x + target.x) / 2;
  const midY = (origin.y + target.y) / 2 - archHeight;

  return {
    path: `M ${origin.x.toFixed(1)} ${origin.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${target.x.toFixed(1)} ${target.y.toFixed(1)}`,
    midPoint: { x: midX, y: midY },
  };
}
