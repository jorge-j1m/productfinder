"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto mt-8 p-6 border border-red-200 rounded-lg bg-red-50">
        <h2 className="text-xl font-semibold text-red-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-red-700 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
