import type { Profile, SwipeAction } from "../types";

type Props = {
  profile: Profile;
  onSwipe: (action: SwipeAction) => void;
  disabled?: boolean;
};

export default function ProfileCard({
  profile,
  onSwipe,
  disabled = false,
}: Props) {
  return (
    <article className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-xl shadow-rose-100/50">
      <div className="relative h-72 bg-rose-100 sm:h-96">
        <img
          src={profile.photoUrl}
          alt={`Profile placeholder for ${profile.name}`}
          className="h-full w-full object-cover"
          draggable={false}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute right-6 bottom-6 left-6 text-white">
          <h2 className="text-3xl font-bold">
            {profile.name}, {profile.age}
          </h2>

          <p className="mt-1 text-sm text-white/90">
            {profile.city}
            {profile.college ? ` · ${profile.college}` : ""}
          </p>
        </div>
      </div>

      <div className="p-6">
        <p className="leading-relaxed text-slate-600">{profile.bio}</p>

        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interests">
          {profile.interests.map((interest) => (
            <li
              key={interest}
              className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
            >
              {interest}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSwipe("pass")}
            disabled={disabled}
            aria-label={`Pass on ${profile.name}`}
            className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ✕ Pass
          </button>

          <button
            type="button"
            onClick={() => onSwipe("like")}
            disabled={disabled}
            aria-label={`Like ${profile.name}`}
            className="rounded-2xl bg-rose-600 px-5 py-4 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            ♥ Like
          </button>
        </div>
      </div>
    </article>
  );
}