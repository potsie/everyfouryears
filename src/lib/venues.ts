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
}

export const VENUES: VenueData[] = [
  { slug: 'bcplace',   name: 'BC Place',                  city: 'Vancouver',      region: 'BC',   country: 'Canada', flag: 'ca', cap: 54500, roof: 'retractable', surface: 'temp grass', opened: 1983, lat: 49.277,  lng: -123.112, matches: 7, role: null,            espnId: 4370  },
  { slug: 'bmo',       name: 'BMO Field',                  city: 'Toronto',        region: 'ON',   country: 'Canada', flag: 'ca', cap: 45736, roof: 'open',        surface: 'natural',   opened: 2007, lat: 43.633,  lng: -79.418,  matches: 6, role: null,            espnId: 10143 },
  { slug: 'lumen',     name: 'Lumen Field',                city: 'Seattle',        region: 'WA',   country: 'USA',    flag: 'us', cap: 68740, roof: 'open',        surface: 'temp grass', opened: 2002, lat: 47.595,  lng: -122.331, matches: 6, role: null,            espnId: 4485  },
  { slug: 'levis',     name: "Levi's Stadium",             city: 'Santa Clara',    region: 'CA',   country: 'USA',    flag: 'us', cap: 70909, roof: 'open',        surface: 'temp grass', opened: 2014, lat: 37.403,  lng: -121.969, matches: 6, role: null,            espnId: 5960  },
  { slug: 'sofi',      name: 'SoFi Stadium',               city: 'Inglewood',      region: 'CA',   country: 'USA',    flag: 'us', cap: 70240, roof: 'fixed',       surface: 'temp grass', opened: 2020, lat: 33.953,  lng: -118.339, matches: 8, role: 'Quarter-final', espnId: 9115  },
  { slug: 'arrowhead', name: 'Arrowhead Stadium',          city: 'Kansas City',    region: 'MO',   country: 'USA',    flag: 'us', cap: 76416, roof: 'open',        surface: 'natural',   opened: 1972, lat: 39.049,  lng: -94.484,  matches: 6, role: 'Quarter-final', espnId: 10897 },
  { slug: 'att',       name: 'AT&T Stadium',               city: 'Arlington',      region: 'TX',   country: 'USA',    flag: 'us', cap: 80000, roof: 'retractable', surface: 'temp grass', opened: 2009, lat: 32.748,  lng: -97.093,  matches: 9, role: 'Semi-final',    espnId: 3871  },
  { slug: 'nrg',       name: 'NRG Stadium',                city: 'Houston',        region: 'TX',   country: 'USA',    flag: 'us', cap: 72220, roof: 'retractable', surface: 'temp grass', opened: 2002, lat: 29.685,  lng: -95.411,  matches: 7, role: null,            espnId: 6262  },
  { slug: 'mercedes',  name: 'Mercedes-Benz Stadium',      city: 'Atlanta',        region: 'GA',   country: 'USA',    flag: 'us', cap: 71000, roof: 'retractable', surface: 'temp grass', opened: 2017, lat: 33.755,  lng: -84.401,  matches: 8, role: 'Semi-final',    espnId: 7485  },
  { slug: 'hardrock',  name: 'Hard Rock Stadium',          city: 'Miami Gardens',  region: 'FL',   country: 'USA',    flag: 'us', cap: 65326, roof: 'open',        surface: 'temp grass', opened: 1987, lat: 25.958,  lng: -80.239,  matches: 7, role: 'Third place',   espnId: 4643  },
  { slug: 'lincoln',   name: 'Lincoln Financial Field',    city: 'Philadelphia',   region: 'PA',   country: 'USA',    flag: 'us', cap: 69596, roof: 'open',        surface: 'natural',   opened: 2003, lat: 39.901,  lng: -75.168,  matches: 6, role: null,            espnId: 1421  },
  { slug: 'gillette',  name: 'Gillette Stadium',           city: 'Foxborough',     region: 'MA',   country: 'USA',    flag: 'us', cap: 65878, roof: 'open',        surface: 'temp grass', opened: 2002, lat: 42.091,  lng: -71.264,  matches: 7, role: 'Quarter-final', espnId: 10660 },
  { slug: 'metlife',   name: 'MetLife Stadium',            city: 'New York',       region: 'NJ',   country: 'USA',    flag: 'us', cap: 82500, roof: 'open',        surface: 'temp grass', opened: 2010, lat: 40.814,  lng: -74.074,  matches: 8, role: 'Final',         espnId: 4727  },
  { slug: 'akron',     name: 'Estadio Akron',              city: 'Guadalajara',    region: 'JAL',  country: 'Mexico', flag: 'mx', cap: 48071, roof: 'open',        surface: 'natural',   opened: 2010, lat: 20.681,  lng: -103.463, matches: 4, role: null,            espnId: 5009  },
  { slug: 'bbva',      name: 'Estadio BBVA',               city: 'Monterrey',      region: 'NL',   country: 'Mexico', flag: 'mx', cap: 53500, roof: 'open',        surface: 'natural',   opened: 2015, lat: 25.669,  lng: -100.244, matches: 4, role: null,            espnId: 6351  },
  { slug: 'azteca',    name: 'Estadio Banorte',            city: 'Mexico City',    region: 'CDMX', country: 'Mexico', flag: 'mx', cap: 87523, roof: 'open',        surface: 'natural',   opened: 1966, lat: 19.303,  lng: -99.150,  matches: 5, role: 'Opening Match', espnId: 1672  },
];

export function getVenueBySlug(slug: string): VenueData | undefined {
  return VENUES.find(v => v.slug === slug);
}

export function venuesByCountry(country: VenueData['country']): VenueData[] {
  return VENUES.filter(v => v.country === country).sort((a, b) => b.cap - a.cap);
}

export function roofLabel(roof: VenueData['roof']): string {
  return { open: 'Open air', retractable: 'Retractable', fixed: 'Fixed roof' }[roof];
}
