import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator } from "lucide-react";

interface HeroProps {
  totalModels: number;
}

export function Hero({ totalModels }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Spotlight grid background */}
      <div className="spotlight-grid spotlight-grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Spotlight beam glow from top */}
      <div
        className="spotlight-beam pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* Animated spotlight sweep */}
      <div
        className="animate-spotlight-sweep pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-spotlight-400/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-spotlight-300 bg-spotlight-50 px-4 py-1.5 text-sm font-medium text-spotlight-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotlight-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-spotlight-500" />
            </span>
            {totalModels}+ models tracked across every major provider
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-5xl font-bold tracking-tight text-ink-900 sm:text-6xl lg:text-7xl" style={{ animationDelay: "0.05s" }}>
            Know what your{" "}
            <span className="relative inline-block">
              <span className="text-gradient-spotlight">AI</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0,4 Q25,0 50,4 T100,4"
                  stroke="#ffd60a"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            will cost
          </h1>

          <p className="animate-fade-in-up mt-8 text-lg text-gray-600 sm:text-xl" style={{ animationDelay: "0.1s" }}>
            Compare LLM pricing across {totalModels}+ models from every major
            provider. Real-time costs, accurate estimates, zero guesswork.
          </p>

          <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.15s" }}>
            <Link href="/models">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Models
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calculator">
              <Button size="lg" variant="accent" className="w-full sm:w-auto">
                <Calculator className="h-4 w-4" />
                Cost Calculator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
