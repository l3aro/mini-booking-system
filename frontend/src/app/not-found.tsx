import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Page not found</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Could not find the requested resource.</p>
      <Link
        href="/login"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Go to Login
      </Link>
    </div>
  );
}
