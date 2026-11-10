/** Instant account chrome while the route segment streams — matches Studio handoff. */
export default function AccountLoading() {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-m3-bg text-m3-text font-sans antialiased">
      <header className="sticky top-0 z-30 border-b border-m3-border/70 bg-m3-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex select-none items-center gap-2 rounded-full border border-m3-border/60 bg-m3-sidebar/80 px-2.5 py-1.5">
            <img src="/favicon.png" alt="" className="h-5 w-5 rounded-md object-contain" />
            <span className="text-xs font-semibold tracking-tight sm:text-sm">Hosanna</span>
          </div>
          <div className="h-9 w-22 rounded-full bg-m3-sidebar/80" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          <div className="hidden md:block w-56 shrink-0 space-y-3">
            <div className="h-3 w-16 rounded bg-m3-sidebar/80 animate-pulse" />
            <div className="h-9 w-full rounded-lg bg-m3-sidebar animate-pulse" />
            <div className="h-3 w-20 rounded bg-m3-sidebar/80 animate-pulse mt-4" />
            <div className="h-9 w-full rounded-lg bg-m3-sidebar animate-pulse" />
            <div className="h-9 w-full rounded-lg bg-m3-sidebar/70 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-6 space-y-2">
              <div className="h-7 w-32 rounded-md bg-m3-sidebar animate-pulse" />
              <div className="h-4 w-72 max-w-full rounded-md bg-m3-sidebar/80 animate-pulse" />
            </div>
            <div className="rounded-2xl border border-m3-border bg-m3-card p-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-linear-to-tr from-sky-600 to-cyan-500 opacity-80" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 rounded-md bg-m3-sidebar animate-pulse" />
                  <div className="h-3 w-56 rounded-md bg-m3-sidebar/80 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-6">
              <div className="h-32 rounded-2xl border border-m3-border bg-m3-card animate-pulse" />
              <div className="h-40 rounded-2xl border border-m3-border bg-m3-card animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
