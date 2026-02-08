export type SearchParams = {
  origin: string;
  destination: string;
  date: string;
};

export type FlightOption = {
  id: string;
  price: number;
  durationMinutes: number;
  carriers: {
    name: string;
    logoUrl?: string;
  }[];
  deepLink: string;
  score: number;
};

const RAPIDAPI_HOST = 'skyscanner44.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/search`;

const DEFAULT_LIMIT = 20;

export async function fetchFlights(params: SearchParams): Promise<FlightOption[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error('Missing RAPIDAPI_KEY');
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('adults', '1');
  url.searchParams.set('currency', 'USD');
  url.searchParams.set('locale', 'en-US');
  url.searchParams.set('origin', params.origin);
  url.searchParams.set('destination', params.destination);
  url.searchParams.set('date', params.date);

  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': RAPIDAPI_HOST
    }
  });

  if (response.status === 429) {
    const error = new Error('Rate limit reached');
    (error as Error & { status?: number }).status = 429;
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Skyscanner API error: ${response.status}`);
  }

  const data = (await response.json()) as SkyscannerResponse;
  const flights = normalizeFlights(data);
  return flights.slice(0, DEFAULT_LIMIT);
}

export function topStressFreeFlights(flights: FlightOption[], limit = 3): FlightOption[] {
  const ranked = flights
    .map((flight) => ({
      ...flight,
      score: flight.price + flight.durationMinutes
    }))
    .sort((a, b) => a.score - b.score);

  return ranked.slice(0, limit);
}

function normalizeFlights(data: SkyscannerResponse): FlightOption[] {
  const itineraries = data?.itineraries ?? [];
  const legs = data?.legs ?? [];
  const carriers = data?.carriers ?? [];

  const carrierById = new Map(carriers.map((carrier) => [carrier.id, carrier]));
  const legById = new Map(legs.map((leg) => [leg.id, leg]));

  return itineraries.map((itinerary) => {
    const outboundLeg = legById.get(itinerary.legs?.[0] ?? '');
    const durationMinutes = outboundLeg?.durationInMinutes ?? 0;
    const price = itinerary.price?.raw ?? 0;
    const carrierIds = outboundLeg?.carriers ?? [];
    const carriersForLeg = carrierIds
      .map((id) => carrierById.get(id))
      .filter(Boolean)
      .map((carrier) => ({
        name: carrier?.name ?? 'Airline',
        logoUrl: carrier?.imageUrl
      }));

    return {
      id: itinerary.id,
      price,
      durationMinutes,
      carriers: carriersForLeg.length ? carriersForLeg : [{ name: 'Airline' }],
      deepLink: itinerary.deeplink ?? buildDeepLink(itinerary.id),
      score: price + durationMinutes
    };
  });
}

function buildDeepLink(itineraryId: string): string {
  return `https://www.skyscanner.com/transport/flights/${encodeURIComponent(itineraryId)}`;
}

type SkyscannerResponse = {
  itineraries?: SkyscannerItinerary[];
  legs?: SkyscannerLeg[];
  carriers?: SkyscannerCarrier[];
};

type SkyscannerItinerary = {
  id: string;
  price?: {
    raw?: number;
  };
  legs?: string[];
  deeplink?: string;
};

type SkyscannerLeg = {
  id: string;
  durationInMinutes?: number;
  carriers?: string[];
};

type SkyscannerCarrier = {
  id: string;
  name?: string;
  imageUrl?: string;
};
