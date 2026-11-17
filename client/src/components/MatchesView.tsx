import type { Match } from "../types";
import ScreenState from "./ScreenState";

type Props = {
  matches: Match[];
  onDiscover: () => void;
};

export default function MatchesView({ matches, onDiscover }: Props) {
  if (matches.length === 0) {
    return (
      <ScreenState
        title="Your next connection is out there"
        message="When you both like each other, your match will appear here."
        actionLabel="Explore Discover"
        onAction={onDiscover}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <li
          key={match.id}
          className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-white p-4"
        >
          <img
            src={match.profile.photoUrl}
            alt={`Profile placeholder for ${match.profile.name}`}
            className="h-20 w-20 rounded-2xl bg-rose-100 object-cover"
          />

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              {match.profile.name}, {match.profile.age}
            </h2>

            <p className="text-sm text-slate-500">
              {match.profile.city}
            </p>

            <p className="mt-2 text-sm font-medium text-rose-600">
              You both liked each other
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}