import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator } from "lucide-react";

interface HeroProps {
  totalModels: number;
}

export function Hero({ totalModels }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-white">
      <div className="spotlight-grid spotlight-grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-4 inline-flex items-center gap-2 rounded-full border border-spotlight-300 bg-spotlight-50 px-3 py-1 text-xs font-medium text-spotlight-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotlight-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-spotlight-500" />
            </span>
            {totalModels}+ models from every major provider
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl" style={{ animationDelay: "0.05s" }}>
            Know what your{" "}
            <span className="text-brand-600">AI</span>{" "}
            will cost
          </h1>

          <p className="animate-fade-in-up mt-4 text-base text-gray-600 sm:text-lg" style={{ animationDelay: "0.1s" }}>
            Compare LLM pricing across {totalModels}+ models. Real-time costs, accurate estimates, zero guesswork.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.15s" }}>
            <Link href="/models">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Models
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calculator">
              <Button size="lg" variant="accent" className="w-full sm:w-auto">
                <Calculator className="h-4 w-4" />
                Calculate Cost
              </Button>
            </Link>
          </div>

          {/* "Already using?" link */}
          <p className="animate-fade-in-up mt-4 text-sm text-gray-400" style={{ animationDelay: "0.2s" }}>
            Already using a model?{" "}
            <Link href="/optimizer" className="font-medium text-brand-600 hover:text-brand-700">
              See if you could save →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
