export interface VenueData {
  slug: string;
  name: string;
  city: string;
  region: string;
  country: 'USA' | 'Canada' | 'Mexico';
  flag: string;
  cap: number;
  roof: 'open' | 'retractable' | 'fixed';
  surface: 'natural' | 'temp grass';
  opened: number;
  lat: number;
  lng: number;
  matches: number;
  role: string | null;
  espnId: number;
  photoUrl: string | null;
  address: string;
}

export const VENUES: VenueData[] = [
  { slug: 'bcplace',   name: 'BC Place',                  city: 'Vancouver',      region: 'BC',   country: 'Canada', flag: 'ca', cap: 54500, roof: 'retractable', surface: 'temp grass', opened: 1983, lat: 49.277,  lng: -123.112, matches: 7, role: null,            espnId: 4370,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/n85qri1726834475.jpg',   address: '777 Pacific Blvd, Vancouver, BC V6B 4Y9' },
  { slug: 'bmo',       name: 'BMO Field',                  city: 'Toronto',        region: 'ON',   country: 'Canada', flag: 'ca', cap: 45736, roof: 'open',        surface: 'natural',   opened: 2007, lat: 43.633,  lng: -79.418,  matches: 6, role: null,            espnId: 10143, photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/jlgkba1726840859.jpg',   address: "170 Princes' Blvd, Toronto, ON M6K 3C3" },
  { slug: 'lumen',     name: 'Lumen Field',                city: 'Seattle',        region: 'WA',   country: 'USA',    flag: 'us', cap: 68740, roof: 'open',        surface: 'temp grass', opened: 2002, lat: 47.595,  lng: -122.331, matches: 6, role: null,            espnId: 4485,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/dz6w2c1721471370.jpg',   address: '800 Occidental Ave S, Seattle, WA 98134' },
  { slug: 'levis',     name: "Levi's Stadium",             city: 'Santa Clara',    region: 'CA',   country: 'USA',    flag: 'us', cap: 70909, roof: 'open',        surface: 'temp grass', opened: 2014, lat: 37.403,  lng: -121.969, matches: 6, role: null,            espnId: 5960,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/z09l491721473248.jpg',   address: '4900 Marie P. DeBartolo Way, Santa Clara, CA 95054' },
  { slug: 'sofi',      name: 'SoFi Stadium',               city: 'Inglewood',      region: 'CA',   country: 'USA',    flag: 'us', cap: 70240, roof: 'fixed',       surface: 'temp grass', opened: 2020, lat: 33.953,  lng: -118.339, matches: 8, role: 'Quarter-final', espnId: 9115,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/lhp59n1721400063.jpg',   address: '1001 S Stadium Dr, Inglewood, CA 90301' },
  { slug: 'arrowhead', name: 'Arrowhead Stadium',          city: 'Kansas City',    region: 'MO',   country: 'USA',    flag: 'us', cap: 76416, roof: 'open',        surface: 'natural',   opened: 1972, lat: 39.049,  lng: -94.484,  matches: 6, role: 'Quarter-final', espnId: 10897, photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/oteqj71721209303.jpg',   address: '1 Arrowhead Dr, Kansas City, MO 64129' },
  { slug: 'att',       name: 'AT&T Stadium',               city: 'Arlington',      region: 'TX',   country: 'USA',    flag: 'us', cap: 80000, roof: 'retractable', surface: 'temp grass', opened: 2009, lat: 32.748,  lng: -97.093,  matches: 9, role: 'Semi-final',    espnId: 3871,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/utxqpt1421276506.jpg',   address: '1 AT&T Way, Arlington, TX 76011' },
  { slug: 'nrg',       name: 'NRG Stadium',                city: 'Houston',        region: 'TX',   country: 'USA',    flag: 'us', cap: 72220, roof: 'retractable', surface: 'temp grass', opened: 2002, lat: 29.685,  lng: -95.411,  matches: 7, role: null,            espnId: 6262,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/ipwr0q1704962403.jpg',   address: '1 NRG Park, Houston, TX 77054' },
  { slug: 'mercedes',  name: 'Mercedes-Benz Stadium',      city: 'Atlanta',        region: 'GA',   country: 'USA',    flag: 'us', cap: 71000, roof: 'retractable', surface: 'temp grass', opened: 2017, lat: 33.755,  lng: -84.401,  matches: 8, role: 'Semi-final',    espnId: 7485,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/zbt2cs1514566030.jpg',   address: '1414 Andrew Young International Blvd NW, Atlanta, GA 30313' },
  { slug: 'hardrock',  name: 'Hard Rock Stadium',          city: 'Miami Gardens',  region: 'FL',   country: 'USA',    flag: 'us', cap: 65326, roof: 'open',        surface: 'temp grass', opened: 1987, lat: 25.958,  lng: -80.239,  matches: 7, role: 'Third place',   espnId: 4643,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/gm0sse1687786834.jpg',   address: '347 Don Shula Dr, Miami Gardens, FL 33056' },
  { slug: 'lincoln',   name: 'Lincoln Financial Field',    city: 'Philadelphia',   region: 'PA',   country: 'USA',    flag: 'us', cap: 69596, roof: 'open',        surface: 'natural',   opened: 2003, lat: 39.901,  lng: -75.168,  matches: 6, role: null,            espnId: 1421,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/rz76hf1721472451.jpg',   address: '1 Lincoln Financial Field Way, Philadelphia, PA 19148' },
  { slug: 'gillette',  name: 'Gillette Stadium',           city: 'Foxborough',     region: 'MA',   country: 'USA',    flag: 'us', cap: 65878, roof: 'open',        surface: 'temp grass', opened: 2002, lat: 42.091,  lng: -71.264,  matches: 7, role: 'Quarter-final', espnId: 10660, photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/4df7ca1719005961.jpg',   address: '1 Patriot Pl, Foxborough, MA 02035' },
  { slug: 'metlife',   name: 'MetLife Stadium',            city: 'New York',       region: 'NJ',   country: 'USA',    flag: 'us', cap: 82500, roof: 'open',        surface: 'temp grass', opened: 2010, lat: 40.814,  lng: -74.074,  matches: 8, role: 'Final',         espnId: 4727,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/u09p8k1497890320.jpg',   address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073' },
  { slug: 'akron',     name: 'Estadio Akron',              city: 'Guadalajara',    region: 'JAL',  country: 'Mexico', flag: 'mx', cap: 48071, roof: 'open',        surface: 'natural',   opened: 2010, lat: 20.681,  lng: -103.463, matches: 4, role: null,            espnId: 5009,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/0w5rt41570393503.jpg',   address: 'Av. Circuito JVC 2800, El Bajío, 45190 Zapopan, Jalisco' },
  { slug: 'bbva',      name: 'Estadio BBVA',               city: 'Monterrey',      region: 'NL',   country: 'Mexico', flag: 'mx', cap: 53500, roof: 'open',        surface: 'natural',   opened: 2015, lat: 25.669,  lng: -100.244, matches: 4, role: null,            espnId: 6351,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/aeonjg1751443591.jpg',   address: 'Av. Pablo Livas 2011, Pastora, 67140 Guadalupe, Nuevo León' },
  { slug: 'azteca',    name: 'Estadio Banorte',            city: 'Mexico City',    region: 'CDMX', country: 'Mexico', flag: 'mx', cap: 87523, roof: 'open',        surface: 'natural',   opened: 1966, lat: 19.303,  lng: -99.150,  matches: 5, role: 'Opening Match', espnId: 1672,  photoUrl: 'https://r2.thesportsdb.com/images/media/venue/thumb/eym03u1721328687.jpg',   address: 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX' },
];

export function getVenueBySlug(slug: string): VenueData | undefined {
  return VENUES.find(v => v.slug === slug);
}

// ESPN venue name → our VenueData (handles known aliases)
const ESPN_VENUE_ALIASES: Record<string, string> = {
  'GEHA Field at Arrowhead Stadium': 'Arrowhead Stadium',
  'Estadio Azteca': 'Estadio Banorte',
};

export function getVenueByName(espnName: string): VenueData | undefined {
  const name = ESPN_VENUE_ALIASES[espnName] ?? espnName;
  return VENUES.find(v => v.name === name);
}

export function venuesByCountry(country: VenueData['country']): VenueData[] {
  return VENUES.filter(v => v.country === country).sort((a, b) => b.cap - a.cap);
}

export function roofLabel(roof: VenueData['roof']): string {
  return { open: 'Open air', retractable: 'Retractable', fixed: 'Fixed roof' }[roof];
}
