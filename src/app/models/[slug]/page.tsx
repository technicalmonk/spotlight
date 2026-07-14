import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModelBySlug, getPriceHistory } from "@/db/queries";
import { Badge } from "@/components/ui/badge";
import { PriceHistory } from "@/components/models/price-history";
import { formatContext, formatPrice, formatDate } from "@/lib/utils";
import { Check, X } from "lucide-react";

export const revalidate = 3600; // ISR — revalidate every hour

export const dynamicParams = true; // Allow new slugs without rebuild

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

  // Fetch price history
  const priceHistory = await getPriceHistory(model.id).catch(() => ({
    modelId: model.id,
    history: [],
  }));

  // JSON-LD structured data
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{provider?.name ?? "Unknown"}</Badge>
            {model.modelFamily && (
              <Badge variant="outline">{model.modelFamily}</Badge>
            )}
            {!model.isActive && (
              <Badge variant="outline" className="text-gray-400">
                Deprecated
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{model.name}</h1>
          {model.openrouterModelId && (
            <p className="text-sm text-gray-500 mt-1 font-mono">
              {model.openrouterModelId}
            </p>
          )}
        </div>

        {/* Pricing */}
        {pricing ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Pricing
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Input ($/1M tokens)</p>
                <p className="text-xl font-mono font-semibold text-gray-900">
                  {formatPrice(pricing.inputPricePerMillion)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Output ($/1M tokens)</p>
                <p className="text-xl font-mono font-semibold text-gray-900">
                  {formatPrice(pricing.outputPricePerMillion)}
                </p>
              </div>
              {pricing.cacheReadPricePerMillion && (
                <div>
                  <p className="text-xs text-gray-500">Cache Read ($/1M)</p>
                  <p className="text-xl font-mono font-semibold text-gray-900">
                    {formatPrice(pricing.cacheReadPricePerMillion)}
                  </p>
                </div>
              )}
              {pricing.cacheWritePricePerMillion && (
                <div>
                  <p className="text-xs text-gray-500">Cache Write ($/1M)</p>
                  <p className="text-xl font-mono font-semibold text-gray-900">
                    {formatPrice(pricing.cacheWritePricePerMillion)}
                  </p>
                </div>
              )}
              {pricing.webSearchPrice && (
                <div>
                  <p className="text-xs text-gray-500">Web Search ($/call)</p>
                  <p className="text-xl font-mono font-semibold text-gray-900">
                    {formatPrice(pricing.webSearchPrice)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Last updated: {formatDate(pricing.createdAt)} · Source: {pricing.source}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6 text-center text-gray-500">
            Pricing data unavailable for this model.
          </div>
        )}

        {/* Specs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Specifications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Context Window</p>
              <p className="text-sm font-mono font-semibold text-gray-900">
                {formatContext(model.contextWindow)}
              </p>
            </div>
            {model.maxOutputTokens && (
              <div>
                <p className="text-xs text-gray-500">Max Output</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {formatContext(model.maxOutputTokens)}
                </p>
              </div>
            )}
            {model.releaseDate && (
              <div>
                <p className="text-xs text-gray-500">Release Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(model.releaseDate)}
                </p>
              </div>
            )}
          </div>

          {/* Modalities */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1">Modalities</p>
            <div className="flex flex-wrap gap-1.5">
              {model.modality.map((mod) => (
                <Badge key={mod} variant="secondary">
                  {mod}
                </Badge>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <CapabilityItem label="Function Calling" supported={model.supportsFunctionCalling} />
            <CapabilityItem label="Streaming" supported={model.supportsStreaming} />
            <CapabilityItem label="Batch" supported={model.supportsBatch} />
            <CapabilityItem label="Structured Output" supported={model.supportsStructuredOutput} />
          </div>
        </div>

        {/* Price History */}
        {priceHistory && priceHistory.history.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Price History
            </h2>
            <PriceHistory history={priceHistory.history} />
          </div>
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
    <div className="flex items-center gap-1.5">
      {supported ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-300" />
      )}
      <span className={supported ? "text-sm text-gray-900" : "text-sm text-gray-400"}>
        {label}
      </span>
    </div>
  );
}
