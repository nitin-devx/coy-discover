import { useEffect, useRef } from "react";
import type { Profile } from "../types";

type Props = {
  profile: Profile;
  onClose: () => void;
  onViewMatches: () => void;
};

export default function MatchModal({
  profile,
  onClose,
  onViewMatches,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="match-title"
      aria-describedby="match-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border-0 bg-white p-8 text-center shadow-2xl backdrop:bg-slate-950/60"
    >
      <p aria-hidden="true" className="text-4xl text-rose-600">
        ♥
      </p>

      <h2 id="match-title" className="mt-3 text-3xl font-bold text-rose-600">
        It&apos;s a match!
      </h2>

      <img
        src={profile.photoUrl}
        alt={`Profile placeholder for ${profile.name}`}
        className="mx-auto mt-6 h-28 w-28 rounded-full border-4 border-rose-100 object-cover"
      />

      <p id="match-description" className="mt-5 text-slate-600">
        You and <strong>{profile.name}</strong> liked each other.
      </p>

      <button
        type="button"
        onClick={onViewMatches}
        className="mt-6 w-full rounded-xl bg-rose-600 py-3 font-semibold text-white hover:bg-rose-700"
      >
        View matches
      </button>

      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-xl py-3 font-medium text-slate-600 hover:bg-slate-50"
      >
        Keep discovering
      </button>
    </dialog>
  );
}