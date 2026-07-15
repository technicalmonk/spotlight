import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ink-900">
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none">
            <path
              d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z"
              fill="#ffd60a"
              stroke="#ffd60a"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="absolute inset-0 -z-10 rounded-2xl bg-spotlight-400/20 blur-xl" />
      </div>
      <h1 className="text-5xl font-bold text-ink-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Page not found.
      </p>
      <p className="mt-2 text-sm text-gray-400">
        The page you are looking for may have been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
