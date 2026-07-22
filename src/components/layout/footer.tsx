export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex items-center gap-2">
              <img src="/xilos-logo-blue.svg" alt="Xilos" className="h-6 w-auto" />
              <span className="text-base font-bold tracking-tight text-ink-900">
                Spotlight
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Know what your AI will cost.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-1.5 sm:items-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Data
              </p>
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-brand-600"
              >
                OpenRouter API
              </a>
            </div>
            <div className="hidden h-12 w-px bg-gray-200 sm:block" />
            <div className="flex flex-col items-center gap-1.5 sm:items-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Built by
              </p>
              <a
                href="https://xilos.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-brand-600"
              >
                Xilos
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
