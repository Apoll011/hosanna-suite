import Link from "next/link";

type FlowPlaceholderProps = {
  title: string;
  description?: string;
};

export function FlowPlaceholder({ title, description }: FlowPlaceholderProps) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,#0369a1_0%,transparent_55%),radial-gradient(ellipse_at_90%_30%,#0284c7_0%,transparent_50%),linear-gradient(180deg,#0c4a6e_0%,#082f49_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(68,224,255,0.12)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/95 p-8 shadow-[0_30px_80px_-30px_rgb(2_132_199_/_0.45)] backdrop-blur-sm">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#0284c7] uppercase">
          Hosanna Auth
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {description ??
            "Placeholder route — real UI will be ported from Studio auth flows."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-lg bg-[#0284c7] px-4 py-2 font-medium text-white transition hover:bg-[#0369a1]"
          >
            Login
          </Link>
          <Link
            href="/account"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-[#0284c7]/hover:text-[#0284c7]"
          >
            Account
          </Link>
        </div>
      </div>
    </main>
  );
}
