import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <h2 className="font-serif text-4xl font-bold text-stone-900 tracking-tight">404</h2>
      <p className="text-sm md:text-base text-stone-600 max-w-xl">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-10 py-3 bg-stone-900 text-white rounded-full hover:bg-amber-800 transition-all font-bold tracking-wide uppercase text-xs"
      >
        BACK TO HOME
      </Link>
    </div>
  );
}
