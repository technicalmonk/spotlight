import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Spotlight — LLM Pricing Comparison",
  description:
    "Compare LLM pricing across every major provider. Real-time costs, accurate estimates, and side-by-side model comparisons for 300+ AI models.",
  metadataBase: new URL("https://spotlight.ai"),
  openGraph: {
    title: "Spotlight — LLM Pricing Comparison",
    description:
      "Compare LLM pricing across every major provider. Real-time costs and accurate estimates for 300+ AI models.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
