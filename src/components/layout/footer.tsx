import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 text-sm text-gray-500 sm:items-start">
            <p>
              Data sourced from{" "}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 hover:underline"
              >
                OpenRouter
              </a>
            </p>
            <p>Built by Mill Pond Research</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/millpondresearch/spotlight"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              <span className="font-mono text-xs">GitHub</span>
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
