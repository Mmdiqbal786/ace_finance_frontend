function LoaderSpinner({ className = "h-5 w-5 text-white" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function FullPageLoader({ message }: { message: string }) {
  return (
    <div
      className="portal-page fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center">
          <img
            src="/Ace_logo_small_light.png"
            alt="Aceolution"
            width={44}
            height={44}
            className="object-contain"
          />
        </span>
        <LoaderSpinner className="h-10 w-10 text-[var(--af-accent)]" />
        <div>
          <p className="text-base font-semibold text-slate-900">{message}</p>
          <p className="mt-1 text-sm text-slate-600">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
}
