import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getModelBySlug, getPriceHistory } from "@/db/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceHistory } from "@/components/models/price-history";
import { formatContext, formatPrice, formatDate } from "@/lib/utils";
import { Check, X, ArrowLeft, Calculator } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = true;

interface ModelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getModelBySlug(slug).catch(() => null);
  if (!data) {
    return { title: "Model not found — Spotlight" };
  }

  const inputPrice = data.currentPricing
    ? formatPrice(data.currentPricing.inputPricePerMillion)
    : "N/A";
  const outputPrice = data.currentPricing
    ? formatPrice(data.currentPricing.outputPricePerMillion)
    : "N/A";

  return {
    title: `${data.model.name} — Pricing & Specs | Spotlight`,
    description: `${data.model.name} by ${data.provider?.name ?? "Unknown"}. Input: ${inputPrice}/1M tokens, Output: ${outputPrice}/1M tokens. Context: ${formatContext(data.model.contextWindow)} tokens.`,
  };
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const { slug } = await params;
  const data = await getModelBySlug(slug).catch(() => null);

  if (!data) {
    notFound();
  }

  const { model, provider, currentPricing: pricing } = data!;

  const priceHistory = await getPriceHistory(model.id).catch(() => ({
    modelId: model.id,
    history: [],
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.name,
    description: `${model.name} by ${provider?.name ?? "Unknown"}`,
    brand: { "@type": "Brand", name: provider?.name ?? "Unknown" },
    offers: pricing
      ? {
          "@type": "Offer",
          price: pricing.inputPricePerMillion,
          priceCurrency: "USD",
          description: `Input: $${pricing.inputPricePerMillion}/1M tokens, Output: $${pricing.outputPricePerMillion}/1M tokens`,
        }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back link */}
        <Link
          href="/models"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Models
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="default">{provider?.name ?? "Unknown"}</Badge>
            {model.modelFamily && (
              <Badge variant="outline">{model.modelFamily}</Badge>
            )}
            {!model.isActive && (
              <Badge variant="outline" className="text-gray-400">
                Deprecated
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold text-ink-900">{model.name}</h1>
          {model.openrouterModelId && (
            <p className="mt-2 font-mono text-sm text-gray-500">
              {model.openrouterModelId}
            </p>
          )}
        </div>

        {/* Pricing — hero card */}
        {pricing ? (
          <Card className="glow-brand mb-6 overflow-hidden">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">
                  Current Pricing
                </h2>
                <Link
                  href={`/calculator?model=${model.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-spotlight-400 px-4 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-spotlight-300"
                >
                  <Calculator className="h-4 w-4" />
                  Calculate Cost
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-spotlight-50 p-4">
                  <p className="text-xs font-medium text-gray-500">Input ($/1M)</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-ink-900">
                    {formatPrice(pricing.inputPricePerMillion)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">Output ($/1M)</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-ink-900">
                    {formatPrice(pricing.outputPricePerMillion)}
                  </p>
                </div>
                {pricing.cacheReadPricePerMillion && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Cache Read ($/1M)</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink-900">
                      {formatPrice(pricing.cacheReadPricePerMillion)}
                    </p>
                  </div>
                )}
                {pricing.cacheWritePricePerMillion && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Cache Write ($/1M)</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink-900">
                      {formatPrice(pricing.cacheWritePricePerMillion)}
                    </p>
                  </div>
                )}
                {pricing.webSearchPrice && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Web Search ($/call)</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink-900">
                      {formatPrice(pricing.webSearchPrice)}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">
                  Last updated: {formatDate(pricing.createdAt)} · Source: {pricing.source}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 p-12 text-center text-gray-500">
            Pricing data unavailable for this model.
          </Card>
        )}

        {/* Specs */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <h2 className="mb-6 text-lg font-semibold text-ink-900">
              Specifications
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-gray-500">Context Window</p>
                <p className="mt-1 font-mono text-lg font-semibold text-ink-900">
                  {formatContext(model.contextWindow)}
                </p>
              </div>
              {model.maxOutputTokens && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Max Output</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-ink-900">
                    {formatContext(model.maxOutputTokens)}
                  </p>
                </div>
              )}
              {model.releaseDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Release Date</p>
                  <p className="mt-1 text-lg font-semibold text-ink-900">
                    {formatDate(model.releaseDate)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-gray-500">Modalities</p>
              <div className="flex flex-wrap gap-2">
                {model.modality.map((mod) => (
                  <Badge key={mod} variant="accent">
                    {mod}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <CapabilityItem label="Function Calling" supported={model.supportsFunctionCalling} />
              <CapabilityItem label="Streaming" supported={model.supportsStreaming} />
              <CapabilityItem label="Batch" supported={model.supportsBatch} />
              <CapabilityItem label="Structured Output" supported={model.supportsStructuredOutput} />
            </div>
          </CardContent>
        </Card>

        {/* Price History */}
        {priceHistory && priceHistory.history.length > 0 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Price History
              </h2>
              <PriceHistory history={priceHistory.history} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CapabilityItem({
  label,
  supported,
}: {
  label: string;
  supported: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-3 ${supported ? "border-brand-200 bg-brand-50/50" : "border-gray-200 bg-gray-50"}`}>
      {supported ? (
        <Check className="h-4 w-4 text-brand-600" />
      ) : (
        <X className="h-4 w-4 text-gray-300" />
      )}
      <span className={`text-sm ${supported ? "font-medium text-ink-900" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
