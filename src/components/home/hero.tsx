import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  totalModels: number;
}

export function Hero({ totalModels }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-white">
      {/* Subtle gradient accent */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/60 to-white"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Know what your AI will cost
          </h1>
          <p className="mt-6 text-lg text-gray-600 sm:text-xl">
            Compare LLM pricing across {totalModels}+ models from every major
            provider. Real-time costs, accurate estimates, zero guesswork.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/models">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Models
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calculator">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Cost Calculator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
