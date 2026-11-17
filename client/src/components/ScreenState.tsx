type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  isError?: boolean;
};

export default function ScreenState({
  title,
  message,
  actionLabel,
  onAction,
  isError = false,
}: Props) {
  return (
    <section
      role={isError ? "alert" : "status"}
      className="rounded-3xl border border-rose-100 bg-white px-6 py-16 text-center"
    >
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-slate-500">
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}