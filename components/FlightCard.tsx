import Image from 'next/image';
import type { FlightOption } from '../lib/skyscanner';

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

type FlightCardProps = {
  flight: FlightOption;
};

export default function FlightCard({ flight }: FlightCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {flight.carriers[0]?.logoUrl ? (
            <Image
              src={flight.carriers[0].logoUrl}
              alt={flight.carriers[0].name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
              {flight.carriers[0]?.name?.charAt(0) ?? 'A'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">{flight.carriers[0]?.name}</p>
            <p className="text-xs text-slate-500">Stress-Free Score: {Math.round(flight.score)}</p>
          </div>
        </div>
        <span className="text-lg font-semibold text-slate-900">${flight.price.toFixed(0)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
          <p className="text-sm font-medium text-slate-900">{formatDuration(flight.durationMinutes)}</p>
        </div>
        <a
          href={flight.deepLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}
