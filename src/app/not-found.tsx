import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Model not found or page does not exist.
      </p>
      <p className="mt-2 text-sm text-gray-400">
        The page you are looking for may have been moved or the model may no
        longer be available.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
