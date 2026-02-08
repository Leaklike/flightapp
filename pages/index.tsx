import Head from 'next/head';
import { useState } from 'react';
import FlightCard from '../components/FlightCard';
import type { FlightOption, SearchParams } from '../lib/skyscanner';
import { fetchFlights, topStressFreeFlights } from '../lib/skyscanner';

const formatDateInput = (date: Date) => date.toISOString().split('T')[0];

type HomeProps = {
  initialFlights: FlightOption[];
  initialError?: string | null;
  defaultParams: SearchParams;
};

export default function Home({ initialFlights, initialError, defaultParams }: HomeProps) {
  const [flights, setFlights] = useState<FlightOption[]>(initialFlights);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState(defaultParams);

  const topFlights = topStressFreeFlights(flights);

  const handleChange = (field: keyof SearchParams) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?origin=${formState.origin}&destination=${formState.destination}&date=${formState.date}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Unable to fetch flights');
      }

      setFlights(payload.flights ?? []);
      if (!payload.flights?.length) {
        setError('No flights found for that route. Try another date.');
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Something went wrong.';
      setError(message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>SwiftFlight | Stress-Free Flight Finder</title>
        <meta name="description" content="SwiftFlight helps you find the top 3 stress-free flights with live data." />
      </Head>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">SwiftFlight</p>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Find the most stress-free flights.</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Live Skyscanner results, ranked by a Stress-Free Score that combines the lowest price with the shortest duration.
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origin</label>
            <input
              value={formState.origin}
              onChange={handleChange('origin')}
              placeholder="SFO"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destination</label>
            <input
              value={formState.destination}
              onChange={handleChange('destination')}
              placeholder="LAX"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</label>
            <input
              type="date"
              value={formState.date}
              onChange={handleChange('date')}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-auto h-[46px] rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Top 3 stress-free picks</h2>
            <span className="text-sm text-slate-500">Updated with live Skyscanner data.</span>
          </div>

          {topFlights.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {topFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-soft">
              No flights found yet. Search for a route to see the top options.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const defaultParams: SearchParams = {
    origin: process.env.DEFAULT_ORIGIN ?? 'SFO',
    destination: process.env.DEFAULT_DESTINATION ?? 'LAX',
    date: process.env.DEFAULT_DATE ?? formatDateInput(new Date(Date.now() + 1000 * 60 * 60 * 24 * 14))
  };

  try {
    const flights = await fetchFlights(defaultParams);
    return {
      props: {
        initialFlights: flights,
        initialError: null,
        defaultParams
      },
      revalidate: 1800
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load flights.';
    return {
      props: {
        initialFlights: [],
        initialError: message,
        defaultParams
      },
      revalidate: 1800
    };
  }
}
