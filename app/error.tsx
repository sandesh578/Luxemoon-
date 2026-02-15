'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
      <h2 className="font-serif text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-stone-500 mb-6">We apologize for the inconvenience.</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}