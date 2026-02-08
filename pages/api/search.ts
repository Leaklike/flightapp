import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFlights, topStressFreeFlights } from '../../lib/skyscanner';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { origin, destination, date } = req.query;

  if (!origin || !destination || !date) {
    return res.status(400).json({ message: 'Origin, destination, and date are required.' });
  }

  try {
    const flights = await fetchFlights({
      origin: String(origin),
      destination: String(destination),
      date: String(date)
    });

    const topFlights = topStressFreeFlights(flights);

    if (!topFlights.length) {
      return res.status(200).json({ flights: [], message: 'No flights found.' });
    }

    return res.status(200).json({ flights: topFlights });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    const message = status === 429
      ? 'Skyscanner API rate limit reached. Please try again shortly.'
      : error instanceof Error
        ? error.message
        : 'Unable to fetch flights.';

    return res.status(status).json({ message });
  }
}
