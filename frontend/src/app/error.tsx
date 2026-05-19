'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Something went wrong</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Retry
      </button>
    </div>
  );
}
