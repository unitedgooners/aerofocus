// Self-contained airport reference data — no external API dependency.
// Covers major airports worldwide for the airport picker's search/browse.
// Each entry: IATA code, name, city, country, lat/lng for proximity search
// against live OpenSky aircraft positions (OpenSky has no scheduled-departure
// data, so "departures from this airport" means "live aircraft near here").

export interface Airport {
  code: string       // IATA code, e.g. 'JFK'
  name: string
  city: string
  country: string
  lat: number
  lng: number
}

export const AIRPORTS: Airport[] = [
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta',      country: 'USA',           lat: 33.6407,  lng: -84.4277 },
  { code: 'LAX', name: 'Los Angeles International',                city: 'Los Angeles',  country: 'USA',           lat: 33.9416,  lng: -118.4085 },
  { code: 'ORD', name: "O'Hare International",                     city: 'Chicago',      country: 'USA',           lat: 41.9742,  lng: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth International',          city: 'Dallas',       country: 'USA',           lat: 32.8998,  lng: -97.0403 },
  { code: 'DEN', name: 'Denver International',                     city: 'Denver',       country: 'USA',           lat: 39.8561,  lng: -104.6737 },
  { code: 'JFK', name: 'John F. Kennedy International',            city: 'New York',     country: 'USA',           lat: 40.6413,  lng: -73.7781 },
  { code: 'SFO', name: 'San Francisco International',              city: 'San Francisco',country: 'USA',           lat: 37.6213,  lng: -122.3790 },
  { code: 'SEA', name: 'Seattle-Tacoma International',             city: 'Seattle',      country: 'USA',           lat: 47.4502,  lng: -122.3088 },
  { code: 'MIA', name: 'Miami International',                      city: 'Miami',        country: 'USA',           lat: 25.7959,  lng: -80.2870 },
  { code: 'BOS', name: 'Logan International',                      city: 'Boston',       country: 'USA',           lat: 42.3656,  lng: -71.0096 },
  { code: 'PHX', name: 'Phoenix Sky Harbor International',         city: 'Phoenix',      country: 'USA',           lat: 33.4373,  lng: -112.0078 },
  { code: 'IAH', name: 'George Bush Intercontinental',             city: 'Houston',      country: 'USA',           lat: 29.9902,  lng: -95.3368 },
  { code: 'LAS', name: 'Harry Reid International',                 city: 'Las Vegas',    country: 'USA',           lat: 36.0840,  lng: -115.1537 },
  { code: 'MCO', name: 'Orlando International',                    city: 'Orlando',      country: 'USA',           lat: 28.4312,  lng: -81.3081 },
  { code: 'EWR', name: 'Newark Liberty International',             city: 'Newark',       country: 'USA',           lat: 40.6895,  lng: -74.1745 },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International',     city: 'Minneapolis',  country: 'USA',           lat: 44.8848,  lng: -93.2223 },
  { code: 'DTW', name: 'Detroit Metropolitan',                     city: 'Detroit',      country: 'USA',           lat: 42.2162,  lng: -83.3554 },
  { code: 'PHL', name: 'Philadelphia International',               city: 'Philadelphia', country: 'USA',           lat: 39.8744,  lng: -75.2424 },
  { code: 'LGA', name: 'LaGuardia',                                 city: 'New York',     country: 'USA',           lat: 40.7769,  lng: -73.8740 },
  { code: 'BWI', name: 'Baltimore/Washington International',       city: 'Baltimore',    country: 'USA',           lat: 39.1774,  lng: -76.6684 },
  { code: 'DCA', name: 'Ronald Reagan Washington National',        city: 'Washington',   country: 'USA',           lat: 38.8512,  lng: -77.0402 },
  { code: 'IAD', name: 'Washington Dulles International',          city: 'Washington',   country: 'USA',           lat: 38.9531,  lng: -77.4565 },
  { code: 'SAN', name: 'San Diego International',                  city: 'San Diego',    country: 'USA',           lat: 32.7338,  lng: -117.1933 },
  { code: 'TPA', name: 'Tampa International',                      city: 'Tampa',        country: 'USA',           lat: 27.9755,  lng: -82.5332 },
  { code: 'PDX', name: 'Portland International',                   city: 'Portland',     country: 'USA',           lat: 45.5898,  lng: -122.5951 },
  { code: 'HNL', name: 'Daniel K. Inouye International',           city: 'Honolulu',     country: 'USA',           lat: 21.3245,  lng: -157.9251 },
  { code: 'AUS', name: 'Austin-Bergstrom International',           city: 'Austin',       country: 'USA',           lat: 30.1975,  lng: -97.6664 },
  { code: 'BNA', name: 'Nashville International',                  city: 'Nashville',    country: 'USA',           lat: 36.1263,  lng: -86.6774 },
  { code: 'STL', name: 'St. Louis Lambert International',          city: 'St. Louis',    country: 'USA',           lat: 38.7487,  lng: -90.3700 },
  { code: 'YYZ', name: 'Toronto Pearson International',            city: 'Toronto',      country: 'Canada',        lat: 43.6777,  lng: -79.6248 },
  { code: 'YVR', name: 'Vancouver International',                  city: 'Vancouver',    country: 'Canada',        lat: 49.1939,  lng: -123.1844 },
  { code: 'YUL', name: 'Montréal-Trudeau International',           city: 'Montreal',     country: 'Canada',        lat: 45.4706,  lng: -73.7408 },
  { code: 'MEX', name: 'Mexico City International',                city: 'Mexico City',  country: 'Mexico',        lat: 19.4363,  lng: -99.0721 },
  { code: 'LHR', name: 'Heathrow',                                  city: 'London',       country: 'UK',            lat: 51.4700,  lng: -0.4543 },
  { code: 'CDG', name: 'Charles de Gaulle',                         city: 'Paris',        country: 'France',        lat: 49.0097,  lng: 2.5479 },
  { code: 'FRA', name: 'Frankfurt am Main',                         city: 'Frankfurt',    country: 'Germany',       lat: 50.0379,  lng: 8.5622 },
  { code: 'AMS', name: 'Amsterdam Schiphol',                        city: 'Amsterdam',    country: 'Netherlands',   lat: 52.3105,  lng: 4.7683 },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas',              city: 'Madrid',       country: 'Spain',         lat: 40.4983,  lng: -3.5676 },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino',               city: 'Rome',         country: 'Italy',         lat: 41.8003,  lng: 12.2389 },
  { code: 'MUC', name: 'Munich',                                    city: 'Munich',       country: 'Germany',       lat: 48.3537,  lng: 11.7860 },
  { code: 'ZRH', name: 'Zürich',                                    city: 'Zurich',       country: 'Switzerland',   lat: 47.4647,  lng: 8.5492 },
  { code: 'DUB', name: 'Dublin',                                    city: 'Dublin',       country: 'Ireland',       lat: 53.4264,  lng: -6.2499 },
  { code: 'IST', name: 'Istanbul',                                  city: 'Istanbul',     country: 'Turkey',        lat: 41.2753,  lng: 28.7519 },
  { code: 'DXB', name: 'Dubai International',                      city: 'Dubai',        country: 'UAE',           lat: 25.2532,  lng: 55.3657 },
  { code: 'DOH', name: 'Hamad International',                      city: 'Doha',         country: 'Qatar',         lat: 25.2731,  lng: 51.6080 },
  { code: 'NRT', name: 'Narita International',                     city: 'Tokyo',        country: 'Japan',         lat: 35.7720,  lng: 140.3929 },
  { code: 'HND', name: 'Haneda',                                    city: 'Tokyo',        country: 'Japan',         lat: 35.5494,  lng: 139.7798 },
  { code: 'ICN', name: 'Incheon International',                    city: 'Seoul',        country: 'South Korea',   lat: 37.4602,  lng: 126.4407 },
  { code: 'PVG', name: 'Shanghai Pudong International',            city: 'Shanghai',     country: 'China',         lat: 31.1443,  lng: 121.8083 },
  { code: 'PEK', name: 'Beijing Capital International',            city: 'Beijing',      country: 'China',         lat: 40.0799,  lng: 116.6031 },
  { code: 'HKG', name: 'Hong Kong International',                  city: 'Hong Kong',    country: 'Hong Kong',     lat: 22.3080,  lng: 113.9185 },
  { code: 'SIN', name: 'Singapore Changi',                         city: 'Singapore',    country: 'Singapore',     lat: 1.3644,   lng: 103.9915 },
  { code: 'BKK', name: 'Suvarnabhumi',                              city: 'Bangkok',      country: 'Thailand',      lat: 13.6900,  lng: 100.7501 },
  { code: 'SYD', name: 'Sydney Kingsford Smith',                    city: 'Sydney',       country: 'Australia',     lat: -33.9399, lng: 151.1753 },
  { code: 'MEL', name: 'Melbourne',                                 city: 'Melbourne',    country: 'Australia',     lat: -37.6690, lng: 144.8410 },
  { code: 'GRU', name: 'São Paulo-Guarulhos International',        city: 'São Paulo',    country: 'Brazil',        lat: -23.4356, lng: -46.4731 },
  { code: 'EZE', name: 'Ministro Pistarini International',         city: 'Buenos Aires', country: 'Argentina',     lat: -34.8222, lng: -58.5358 },
  { code: 'JNB', name: 'O.R. Tambo International',                 city: 'Johannesburg', country: 'South Africa',  lat: -26.1392, lng: 28.2460 },
  { code: 'CAI', name: 'Cairo International',                      city: 'Cairo',        country: 'Egypt',         lat: 30.1219,  lng: 31.4056 },
]

// Search by code (exact or prefix) or city name (substring, case-insensitive)
export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return AIRPORTS.filter(a =>
    a.code.toLowerCase().startsWith(q) ||
    a.city.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q)
  ).slice(0, 8)
}