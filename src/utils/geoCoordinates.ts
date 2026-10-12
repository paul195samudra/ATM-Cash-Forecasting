import { ATMRecord } from '../data/atmData';
import { getAtmRegion } from './cashCalculations';

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  highway: string;
  roadKmFromDhaka: number;
}

// Calibrated geographic coordinates for the 12 banking corridors across Bangladesh
export const CORRIDOR_GEO_COORDS: Record<string, GeoLocation> = {
  DHA_CORE: {
    lat: 23.7289,
    lng: 90.4175,
    name: 'Dhaka Motijheel Banking Core',
    highway: 'National Banking Hub',
    roadKmFromDhaka: 0,
  },
  DHA_NORTH: {
    lat: 23.7925,
    lng: 90.4078,
    name: 'Dhaka North (Gulshan/Uttara)',
    highway: 'Dhaka Arterial Ring (N3)',
    roadKmFromDhaka: 12,
  },
  DHA_DIPLO: {
    lat: 23.7937,
    lng: 90.4253,
    name: 'Dhaka Diplomatic (Baridhara)',
    highway: 'Pragati Sarani Corridor',
    roadKmFromDhaka: 14,
  },
  DHA_WEST: {
    lat: 23.7538,
    lng: 90.3667,
    name: 'Dhaka West (Dhanmondi/Mirpur)',
    highway: 'Mirpur Road Corridor',
    roadKmFromDhaka: 9,
  },
  CTG_PORT: {
    lat: 22.3384,
    lng: 91.8317,
    name: 'Chittagong Port & Agrabad Commercial',
    highway: 'N1 Highway',
    roadKmFromDhaka: 242,
  },
  COX_COAST: {
    lat: 21.4272,
    lng: 92.0058,
    name: "Cox's Bazar Coastal Resort Hub",
    highway: 'N1 Coastal Marine Link',
    roadKmFromDhaka: 396,
  },
  SYL_VALLEY: {
    lat: 24.8949,
    lng: 91.8687,
    name: 'Sylhet Valley & Tea Belt',
    highway: 'N2 Highway Corridor',
    roadKmFromDhaka: 240,
  },
  RAJ_BOGRA: {
    lat: 24.3745,
    lng: 88.6042,
    name: 'Rajshahi & Bogra Agro-Industrial Hub',
    highway: 'N5 Highway / Jamuna Bridge',
    roadKmFromDhaka: 256,
  },
  KHU_JESSORE: {
    lat: 22.8456,
    lng: 89.5403,
    name: 'Khulna & Jessore Industrial Port',
    highway: 'N7 Highway Corridor',
    roadKmFromDhaka: 228,
  },
  BAR_PADMA: {
    lat: 22.701,
    lng: 90.3535,
    name: 'Barisal Riverine Hub',
    highway: 'N8 Padma Bridge Expressway',
    roadKmFromDhaka: 180,
  },
  MYM_TANGAIL: {
    lat: 24.7471,
    lng: 90.4203,
    name: 'Mymensingh & Tangail Agro Belt',
    highway: 'N3 Highway Gateway',
    roadKmFromDhaka: 122,
  },
  COM_FENI: {
    lat: 23.4607,
    lng: 91.1809,
    name: 'Comilla & Feni Transit Corridor',
    highway: 'N1 Highway Midpoint',
    roadKmFromDhaka: 98,
  },
};

// Recognized specific landmark anchor coordinates across Bangladesh
const LANDMARK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Uttara & Airport
  UTTARA: { lat: 23.8759, lng: 90.3795 },
  GARIB: { lat: 23.8698, lng: 90.3892 },
  AIRPORT: { lat: 23.8512, lng: 90.4079 },
  TONGI: { lat: 23.8967, lng: 90.4012 },
  GAZIPUR: { lat: 23.9999, lng: 90.4203 },
  SAVAR: { lat: 23.8583, lng: 90.2667 },

  // Gulshan, Banani, Baridhara, Badda
  GULSHAN: { lat: 23.7925, lng: 90.4158 },
  BANANI: { lat: 23.7937, lng: 90.4043 },
  BARIDHARA: { lat: 23.8012, lng: 90.4253 },
  BADDA: { lat: 23.7801, lng: 90.4267 },
  PRAGATI: { lat: 23.8115, lng: 90.4241 },
  KURIL: { lat: 23.8194, lng: 90.4198 },
  MOHAKHALI: { lat: 23.7778, lng: 90.4056 },
  BASHUNDHARA: { lat: 23.8155, lng: 90.4328 },

  // Dhanmondi, Mirpur, Mohammadpur
  DHANMONDI: { lat: 23.7461, lng: 90.3742 },
  MIRPUR: { lat: 23.8069, lng: 90.3687 },
  MOHAMMADPUR: { lat: 23.7658, lng: 90.3584 },
  SHYAMOLI: { lat: 23.7712, lng: 90.3621 },
  SCIENCE: { lat: 23.7389, lng: 90.3831 },
  ELEPHANT: { lat: 23.7397, lng: 90.3881 },
  GREEN: { lat: 23.7508, lng: 90.3862 },
  PANTHAPATH: { lat: 23.7519, lng: 90.3879 },

  // Old Dhaka & Motijheel
  MOTIJHEEL: { lat: 23.7289, lng: 90.4175 },
  DILKUSHA: { lat: 23.7275, lng: 90.4198 },
  KAWRAN: { lat: 23.7506, lng: 90.3934 },
  BIJOY: { lat: 23.7335, lng: 90.4121 },
  SHANTINAGAR: { lat: 23.7394, lng: 90.4162 },
  MALIBAGH: { lat: 23.7456, lng: 90.4132 },
  WARI: { lat: 23.7189, lng: 90.4194 },
  PURANA: { lat: 23.7298, lng: 90.4122 },
  CHAWK: { lat: 23.7172, lng: 90.3986 },
  NARAYANGANJ: { lat: 23.6238, lng: 90.5000 },

  // Chittagong & Cox's Bazar
  AGRABAD: { lat: 22.3255, lng: 91.8123 },
  GEC: { lat: 22.3589, lng: 91.8219 },
  NASIRABAD: { lat: 22.3672, lng: 91.8256 },
  CHITTAGONG: { lat: 22.3384, lng: 91.8317 },
  COX: { lat: 21.4272, lng: 92.0058 },

  // Sylhet
  ZINDABAZAR: { lat: 24.8978, lng: 91.8714 },
  SYLHET: { lat: 24.8949, lng: 91.8687 },
  SREEMANGAL: { lat: 24.3065, lng: 91.7296 },

  // Rajshahi & Bogra
  RAJSHAHI: { lat: 24.3745, lng: 88.6042 },
  BOGRA: { lat: 24.8465, lng: 89.3777 },
  DINAJPUR: { lat: 25.6279, lng: 88.6332 },

  // Khulna & Jessore
  KHULNA: { lat: 22.8456, lng: 89.5403 },
  JESSORE: { lat: 23.1667, lng: 89.2167 },
  BENAPOLE: { lat: 23.0428, lng: 88.8967 },

  // Barisal
  BARISAL: { lat: 22.701, lng: 90.3535 },
  FARIDPUR: { lat: 23.6071, lng: 89.8429 },

  // Mymensingh & Tangail
  MYMENSINGH: { lat: 24.7471, lng: 90.4203 },
  TANGAIL: { lat: 24.2513, lng: 89.9167 },

  // Comilla & Feni
  COMILLA: { lat: 23.4607, lng: 91.1809 },
  FENI: { lat: 23.0159, lng: 91.3976 },
};

// Deterministic 32-bit hash function for string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns deterministic latitude and longitude for any ATM.
 * Combines regional corridor anchor, landmark matching, and terminal hash dispersion.
 */
export function getAtmGeoCoordinates(atm: ATMRecord): {
  lat: number;
  lng: number;
  corridorKey: string;
  corridorName: string;
  highway: string;
  distanceKm: number;
} {
  const reg = getAtmRegion(atm.ATMID);
  const corridorKey = reg.code || 'DHA_CORE';
  const corridor = CORRIDOR_GEO_COORDS[corridorKey] || CORRIDOR_GEO_COORDS.DHA_CORE;

  // Check if location text has any recognized landmark keywords
  const locUpper = (atm.Location || '').toUpperCase();
  let baseLat = corridor.lat;
  let baseLng = corridor.lng;

  for (const [key, coords] of Object.entries(LANDMARK_COORDINATES)) {
    if (locUpper.includes(key)) {
      baseLat = coords.lat;
      baseLng = coords.lng;
      break;
    }
  }

  // Deterministic micro-dispersion so multiple ATMs in the same branch don't overlap exactly
  const hash = hashString(atm.ATMID);
  const offsetLat = (((hash % 1000) - 500) / 1000) * 0.018; // ~1.5km spread
  const offsetLng = ((((hash >> 8) % 1000) - 500) / 1000) * 0.018;

  const lat = Math.round((baseLat + offsetLat) * 10000) / 10000;
  const lng = Math.round((baseLng + offsetLng) * 10000) / 10000;

  // Approximate distance from Central Bank Vault in Motijheel
  const dLat = (lat - 23.7289) * 111;
  const dLng = (lng - 90.4175) * 102;
  const distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10;

  return {
    lat,
    lng,
    corridorKey,
    corridorName: corridor.name,
    highway: corridor.highway,
    distanceKm,
  };
}

/**
 * Formats coordinates into standard GPS text representation
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
}
