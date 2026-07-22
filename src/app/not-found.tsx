import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <img src="/xilos-logo-blue.svg" alt="Xilos" className="mb-8 h-12 w-auto" />
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
