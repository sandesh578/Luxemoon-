import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <h2 className="font-serif text-4xl font-bold text-stone-900 mb-4">404</h2>
      <p className="text-stone-600 mb-8 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-amber-800 transition-all font-bold tracking-wide"
      >
        BACK TO HOME
      </Link>
    </div>
  );
}
