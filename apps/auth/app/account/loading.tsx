/** Content-only skeleton — chrome stays mounted in the account layout. */
export default function AccountLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-m3-sidebar animate-pulse" />
        <div className="h-4 w-72 max-w-full rounded-md bg-m3-sidebar/80 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-48 rounded-2xl border border-m3-border bg-m3-card animate-pulse" />
        <div className="h-48 rounded-2xl border border-m3-border bg-m3-card animate-pulse" />
      </div>
    </div>
  );
}
