import logo from "@/assets/hosanna_logo.webp";
import dashboardImg from "@/assets/main_mockup.webp";
import mobileImg from "@/assets/mobile-view.webp";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LazySection } from "@/components/ui/LazySection";
import { useReveal } from "@/hooks/useReveal";
import { reopenCookieBanner } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CircleDot,
  Code2,
  FileDown,
  FolderTree,
  Gauge,
  Monitor,
  Music,
  Search,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sun,
  Timer,
  Users,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Hero from "../ui/Hero";
import HeroHeader from "../ui/HeroHeader";
import { MigrationSection } from "../ui/MigrationSection";
import { SectionHeader } from "../ui/SectionHeader";
import { GetAppButton } from "../ui/StoreButton";

function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" hash="top" className={cn("flex items-center", className)}>
      <img
        src={logo}
        alt="Hosanna Studio"
        className="w-14 h-14 rounded-xl object-contain transition-transform hover:scale-105 hover:rotate-2"
      />
    </Link>
  );
}

const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL + "/new";
export function Nav() {
  return <HeroHeader />;
}

export function StaffLines(_props: { className?: string }) {
  return null;
}

function Problem() {
  const { t, dict } = useI18n();

  return (
    <section className="relative bg-transparent py-16 md:py-16 font-sans">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.problem.title")}>
          {t("landing.problem.description")}
        </SectionHeader>
        <div className="reveal mt-16 grid gap-8 md:grid-cols-3">
          {dict.landing.problem.cards.map((c: { title: string; body: string }) => (
            <div
              key={c.title}
              className="rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 text-center text-white transition-all hover:border-cyan-400/40 shadow-xl group"
            >
              <h3 className="font-display text-2xl text-cyan-300 mb-3">{c.title}</h3>
              <p className="text-base leading-relaxed text-white/80">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TwoApps() {
  const { t, dict } = useI18n();

  return (
    <section id="features" className="relative bg-transparent py-16 md:py-16">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.twoApps.title")}>
          {t("landing.twoApps.description")}
        </SectionHeader>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="reveal group relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 md:p-10 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                <Monitor className="h-5 w-5" />
              </div>
              <h3 className="font-display text-2xl text-white">
                {t("landing.twoApps.dashboardTitle")}
              </h3>
            </div>
            <img
              src={dashboardImg}
              alt="Dashboard preview"
              loading="lazy"
              width={1400}
              height={972}
              decoding="async"
              className="mt-8 w-full rounded-xl border border-white/10"
            />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {dict.landing.twoApps.dashboardFeatures.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal group relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 md:p-10 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-display text-2xl text-white">
                {t("landing.twoApps.mobileTitle")}
              </h3>
            </div>
            <div className="mt-8 grid place-items-center rounded-xl bg-slate-950/40 border border-white/10 p-6">
              <img
                src={mobileImg}
                alt="Mobile app preview"
                loading="lazy"
                width={800}
                height={1408}
                className="w-150 rounded-2xl"
              />
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {dict.landing.twoApps.mobileFeatures.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Organize() {
  const { t, dict } = useI18n();
  const icons = [FolderTree, Search, Music];

  return (
    <section className="bg-transparent py-16 md:py-16">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.organize.title")}>
          {t("landing.organize.description")}
        </SectionHeader>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {dict.landing.organize.cards.map((card: { title: string; body: string }, idx: number) => {
            const Icon = icons[idx] || FolderTree;
            return (
              <div
                key={card.title}
                className="reveal rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 text-white transition-all hover:-translate-y-1 hover:border-cyan-400/40 shadow-xl"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AppGallery() {
  return (
    <LazySection
      load={() => import("./AppGallery")}
      fallback={<section className="bg-transparent py-16 md:py-16" aria-hidden />}
      rootMargin="500px"
    />
  );
}

function HowItWorks() {
  const { t, dict } = useI18n();

  return (
    <section id="how" className="relative bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.howItWorks.title")}>
          <span className="text-white/80">{t("landing.howItWorks.description")}</span>
        </SectionHeader>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dict.landing.howItWorks.steps.map((s: { n: string; title: string; body: string }) => (
            <div
              key={s.n}
              className="reveal rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-7 text-white transition-all hover:-translate-y-1 shadow-xl"
            >
              <div className="font-display text-4xl text-cyan-400 font-bold">{s.n}</div>
              <h3 className="mt-3 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveWorship() {
  const { t } = useI18n();

  const items = [
    { icon: Sliders, label: t("landing.liveWorship.items.transpose") },
    { icon: Sun, label: t("landing.liveWorship.items.textSize") },
    { icon: Music, label: t("landing.liveWorship.items.chordsVisibility") },
    { icon: WifiOff, label: t("landing.liveWorship.items.offline") },
    { icon: Timer, label: t("landing.liveWorship.items.metronome") },
    { icon: Gauge, label: t("landing.liveWorship.items.autoScroll") },
    { icon: FileDown, label: t("landing.liveWorship.items.pdfExport") },
    { icon: CircleDot, label: t("landing.liveWorship.items.circleOfFifths") },
  ];

  return (
    <section className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 md:px-8 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
            {t("landing.liveWorship.title")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
            {t("landing.liveWorship.description")}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {items.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-4 text-white shadow-sm"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal relative">
          <div className="absolute -inset-6 rounded-3xl bg-cyan-500/10 blur-2xl pointer-events-none" />
          <img
            src={mobileImg}
            alt="Hosanna mobile live worship view"
            loading="lazy"
            width={800}
            height={1408}
            className="relative mx-auto w-55 rounded-3xl md:w-200"
          />
        </div>
      </div>
    </section>
  );
}

function AnySize() {
  const { t } = useI18n();

  return (
    <section className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.anySize.title")}>
          {t("landing.anySize.description")}
        </SectionHeader>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="reveal rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 text-white shadow-xl">
            <ShieldCheck className="h-8 w-8 text-cyan-300" />
            <h3 className="mt-4 font-display text-xl font-semibold text-white">
              {t("landing.anySize.privateLibTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {t("landing.anySize.privateLibBody")}
            </p>
          </div>
          <div className="reveal rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 text-white shadow-xl">
            <Users className="h-8 w-8 text-cyan-300" />
            <h3 className="mt-4 font-display text-xl font-semibold text-white">
              {t("landing.anySize.multiTeamTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {t("landing.anySize.multiTeamBody")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExportSection() {
  const { t, dict } = useI18n();

  return (
    <section className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="reveal">
          <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-4xl">
            {t("landing.export.title")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
            {t("landing.export.description")}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white">
            {dict.landing.export.bullets.map((b: string) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-cyan-300" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal">
          <div className="rounded-2xl border border-white/15 bg-slate-900/70 backdrop-blur-md p-6 shadow-2xl text-white">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cyan-300">
              <FileDown className="h-4 w-4 text-cyan-300" />{" "}
              {t("landing.export.sampleServiceTitle")}
            </div>
            <div className="space-y-2 text-sm">
              {dict.landing.export.sampleItems.map((s: string, i: number) => (
                <div
                  key={s}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                >
                  <span className="font-medium text-white">
                    <span className="mr-2 text-white/60">{i + 1}.</span>
                    {s}
                  </span>
                  <span className="text-xs text-white/60">PDF</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t, dict } = useI18n();
  const [annual, setAnnual] = useState(true);
  // Defaults match auth-app billing pricing — overridden by public auth pricing when available.
  const [monthlyCents, setMonthlyCents] = useState(1200);
  const [annualCents, setAnnualCents] = useState(12000);
  useEffect(() => {
    const auth =
      (import.meta.env.VITE_AUTH_URL as string | undefined)?.replace(/\/$/, "") ||
      (import.meta.env.DEV ? "" : "https://auth.hosanna.live");
    void fetch(`${auth}/api/billing/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (typeof data.monthly?.amountCents === "number") {
          setMonthlyCents(data.monthly.amountCents);
        }
        if (typeof data.annual?.amountCents === "number") {
          setAnnualCents(data.annual.amountCents);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);
  const price = annual ? annualCents / 100 : monthlyCents / 100;
  const unit = annual ? t("landing.pricing.perYearUnit") : t("landing.pricing.perMonthUnit");

  return (
    <section id="pricing" className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.pricing.title")}>
          {t("landing.pricing.description")}
        </SectionHeader>

        <div className="reveal mt-10 flex items-center justify-center">
          <div className="relative flex w-full max-w-70 items-center rounded-2xl bg-slate-900/80 border border-white/15 p-1.5 shadow-inner">
            <div
              className={cn(
                "absolute inset-y-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-xl bg-cyan-400 shadow-md transition-all duration-300 ease-out",
                annual ? "translate-x-[calc(100%+6px)]" : "translate-x-0",
              )}
            />
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200",
                !annual ? "text-slate-950 font-bold" : "text-white/70 hover:text-white",
              )}
            >
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200",
                annual ? "text-slate-950 font-bold" : "text-white/70 hover:text-white",
              )}
            >
              {t("landing.pricing.annual")}
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  annual
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30",
                )}
              >
                {t("landing.pricing.discountBadge")}
              </span>
            </button>
          </div>
        </div>

        <div className="reveal mx-auto mt-12 max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/75 backdrop-blur-xl p-8 text-white shadow-2xl md:p-12">
            <div className="relative">
              <div className="font-display text-4xl font-semibold md:text-5xl text-white">
                Hosanna
              </div>
              <p className="mt-2 text-white/75">{t("landing.pricing.singlePlanDesc")}</p>

              <div className="mt-8 flex items-baseline gap-2">
                <span className="font-display text-6xl font-semibold md:text-7xl text-cyan-300">
                  {price}€
                </span>
                <span className="text-white/70">{unit}</span>
              </div>
              <p className="mt-1 text-xs text-white/60">
                {annual
                  ? t("landing.pricing.annualBilledNote")
                  : t("landing.pricing.monthlyBilledNote")}
                {" · "}
                {t("landing.pricing.unlimitedMusicians")}
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {dict.landing.pricing.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="mt-10 w-full rounded-full bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg py-6 text-lg"
              >
                <a href={`${dashboardUrl}/?plan=base&payment=${annual ? "yearly" : "monthly"}`}>
                  {t("landing.pricing.ctaTry")} <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <p className="mt-3 text-center text-xs text-white/60">
                {t("landing.pricing.freeTrialDays")}
              </p>
            </div>
          </div>

          <p className="reveal mt-6 text-center text-sm text-white/70">
            {t("landing.pricing.pricingClarification")}
          </p>

          <div className="reveal mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-white/15 bg-slate-900/50 backdrop-blur-md px-5 py-4 text-sm text-white/80">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <p>
              <span className="font-medium text-white">
                {t("landing.pricing.multiCampusLabel")}
              </span>{" "}
              {t("landing.pricing.multiCampusText")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileApp() {
  const { t } = useI18n();

  return (
    <section
      id="mobile"
      className="py-16 bg-transparent overflow-hidden relative font-sans text-white"
    >
      <div className="container mx-auto px-5 md:px-8 relative z-10 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 reveal">
            <h2 className="text-4xl md:text-6xl font-display text-white leading-[1.1] tracking-tight">
              {t("landing.mobileApp.titleStart")}{" "}
              <span className="text-cyan-300">{t("landing.mobileApp.titleHighlight")}</span>.
            </h2>
            <p className="text-xl text-white/80 leading-relaxed max-w-xl">
              {t("landing.mobileApp.description")}
            </p>
            <div className="flex flex-wrap gap-5 pt-4">
              <GetAppButton href="https://github.com/Apoll011/Hosanna/releases/latest" />
            </div>
          </div>
          <div className="relative reveal">
            <div className="absolute -inset-10 bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />
            <img
              src={mobileImg}
              alt="Hosanna Mobile App"
              width={800}
              height={1408}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-150 mx-auto drop-shadow-2xl rounded-3xl transform lg:rotate-6 transition-transform hover:rotate-0 duration-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Vision() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <p className="reveal mt-6 font-display text-3xl leading-snug text-white md:text-4xl lg:text-5xl">
          {t("landing.vision.quote1")}
        </p>
        <p className="reveal mt-6 text-base leading-relaxed text-white/80 md:text-lg">
          {t("landing.vision.body")}
        </p>
        <p className="reveal mt-8 font-display text-lg italic text-cyan-300 md:text-xl">
          “{t("landing.vision.quote2")}”
        </p>
      </div>
    </section>
  );
}

const githubAppUrl = "https://github.com/Apoll011/Hosanna";
const githubStudioUrl = "https://github.com/Apoll011/hosanna-suite";

function OpenSource() {
  const { t } = useI18n();

  return (
    <section id="open-source" className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_auto] md:items-center md:px-8">
        <div className="reveal">
          <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white md:text-4xl">
            {t("landing.openSource.title")}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {t("landing.openSource.body")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-cyan-400 hover:bg-cyan-300 font-bold px-6">
              <a href={githubAppUrl} target="_blank" rel="noreferrer">
                <Code2 className="mr-2 h-4 w-4" />
                {t("landing.openSource.ctaApp")}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 text-slate-950  hover:bg-white/10 px-6"
            >
              <a href={githubStudioUrl} target="_blank" rel="noreferrer">
                {t("landing.openSource.ctaStudio")}
              </a>
            </Button>
          </div>
        </div>
        <div className="reveal hidden rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-6 text-sm text-white/80 md:block">
          <div className="font-mono text-xs text-cyan-300">Apache License 2.0</div>
          <div className="mt-2 text-white/70">github.com/Apoll011/Hosanna</div>
          <div className="text-white/70">github.com/Apoll011/hosanna-suite</div>
        </div>
      </div>
    </section>
  );
}

function SupportTheMission() {
  const { t } = useI18n();
  const goFundMeUrl =
    "https://www.gofundme.com/f/ajudenos-a-levar-o-hosanna-a-igrejas-de-todo-o-mundo";

  return (
    <section className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.support.title")}>
          {t("landing.support.description")}
        </SectionHeader>

        <div className="reveal mt-10 flex justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-8 shadow-xl"
          >
            <a href={goFundMeUrl} target="_blank" rel="noopener noreferrer">
              {t("landing.support.cta")} <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const { t, dict } = useI18n();

  return (
    <section className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader title={t("landing.roadmap.title")}>
          {t("landing.roadmap.description")}
        </SectionHeader>
        <div className="reveal mt-14 grid gap-x-12 sm:grid-cols-2">
          {dict.landing.roadmap.items.map((item: string) => (
            <div key={item} className="flex items-center py-4 border-b border-white/10">
              <span className="text-sm leading-relaxed text-white/85">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t, dict } = useI18n();

  return (
    <section id="faq" className="bg-transparent py-16 md:py-16 text-white font-sans">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SectionHeader title={t("landing.faq.title")}>{t("landing.faq.description")}</SectionHeader>
        <div className="reveal mt-12">
          <Accordion type="single" collapsible className="w-full">
            {dict.landing.faq.items.map((f: { q: string; a: string }, i: number) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-b border-white/15">
                <AccordionTrigger className="text-left font-display text-lg font-medium text-white hover:text-cyan-300 hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-white/80 pb-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-transparent py-16 md:py-24 text-white font-sans">
      <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
        <h2 className="reveal font-display text-4xl leading-tight tracking-tight md:text-6xl text-white">
          {t("landing.finalCta.title")}
        </h2>
        <p className="reveal mx-auto mt-6 max-w-xl text-white/80 md:text-xl">
          {t("landing.finalCta.subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row reveal">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-10 text-lg shadow-xl transition-all hover:scale-105 active:scale-95 py-6"
          >
            <a href={dashboardUrl}>
              {t("landing.finalCta.ctaStart")} <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 px-10 text-lg font-medium backdrop-blur-md transition-all py-6"
          >
            <Link to="/contact">{t("landing.finalCta.ctaContact")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  const colInfo = [
    { label: t("landing.footer.features"), href: "/#features", isInternal: false },
    { label: t("landing.footer.chordproGuide"), href: "/chordpro", isInternal: true },
    { label: t("landing.footer.pricing"), href: "/#pricing", isInternal: false },
    { label: t("landing.nav.about"), href: "/about", isInternal: true },
    { label: t("landing.footer.downloadApp"), href: "/#mobile", isInternal: false },
    { label: t("landing.footer.openSource"), href: "/#open-source", isInternal: false },
  ];

  const colSocial = [
    { label: "GitHub", href: githubAppUrl },
    { label: "Instagram", href: "https://www.instagram.com/hosanna.studio" },
    { label: "YouTube", href: "https://www.youtube.com/@hosanna.studio" },
    { label: "Blog", href: "https://blog.hosanna.live" },
  ];

  const colNav = [
    { label: t("common.backToHome"), href: "/", isInternal: true },
    { label: t("landing.nav.about"), href: "/about", isInternal: true },
    { label: t("landing.footer.chordproGuide"), href: "/chordpro", isInternal: true },
    { label: t("landing.footer.contact"), href: "/contact", isInternal: true },
    { label: t("landing.footer.termsOfService"), href: "/terms", isInternal: true },
    { label: t("landing.footer.privacyPolicy"), href: "/privacy", isInternal: true },
    {
      label: t("cookieConsent.cookieSettings"),
      onClick: () => reopenCookieBanner(),
      isAction: true,
    },
  ];

  return (
    <footer className="relative z-30 bg-white text-[#021433] pt-20 pb-12 shadow-[0_-25px_60px_rgba(0,0,0,0.35)] border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link
              to="/"
              hash="top"
              className="inline-block transition-transform hover:scale-105 mb-6"
            >
              <img
                src={logo}
                alt="Hosanna Studio"
                className="w-12 h-12 rounded-xl object-contain shadow-sm"
              />
            </Link>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#021433] leading-snug tracking-tight">
              Música para a igreja.
              <br />
              Simples, moderno e fiável.
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed max-w-sm">
              {t("landing.footer.tagline")}
            </p>
            <a
              href="mailto:hosanna.songbook@gmail.com"
              className="inline-flex items-center gap-2 mt-6 text-base font-semibold text-[#0284c7] hover:text-[#0538A6] transition-colors group"
            >
              hosanna.songbook@gmail.com
              <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
            </a>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                {t("landing.footer.colProduct")}
              </div>
              <ul className="mt-6 space-y-3.5 text-sm font-sans">
                {colInfo.map((link) => (
                  <li key={link.label}>
                    {link.isInternal ? (
                      <Link
                        to={link.href}
                        className="text-slate-600 transition-colors hover:text-[#0538A6] font-medium"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-slate-600 transition-colors hover:text-[#0538A6] font-medium"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                {t("landing.footer.colSupport")}
              </div>
              <ul className="mt-6 space-y-3.5 text-sm font-sans">
                {colSocial.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-[#0538A6] font-medium group"
                    >
                      {item.label}
                      <span className="text-xs text-slate-400 group-hover:text-[#0538A6] transition-colors">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                Navegação
              </div>
              <ul className="mt-6 space-y-3.5 text-sm font-sans">
                {colNav.map((link) => {
                  const isActive = "href" in link && link.href === currentPath;
                  return (
                    <li key={link.label} className="relative flex items-center">
                      {"isAction" in link && link.isAction ? (
                        <button
                          type="button"
                          onClick={link.onClick}
                          className="text-left text-slate-600 transition-colors hover:text-[#0538A6] font-medium cursor-pointer"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          to={link.href}
                          className={cn(
                            "flex items-center transition-colors font-medium",
                            isActive
                              ? "text-[#0538A6] font-bold"
                              : "text-slate-600 hover:text-[#0538A6]",
                          )}
                        >
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] inline-block mr-2 shrink-0 shadow-[0_0_6px_rgba(2,132,199,0.6)]" />
                          )}
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Hosanna Studio. {t("landing.footer.copyright")}
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-300 text-xs font-bold uppercase tracking-wider text-[#021433] hover:border-[#0284c7] hover:text-[#0284c7] hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="Voltar ao topo"
          >
            TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

export function HosannaLanding() {
  useReveal();
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-transparent font-sans text-foreground antialiased relative z-10"
    >
      <main>
        <Hero />
        <Problem />
        <TwoApps />
        <Organize />
        <AppGallery />
        <MigrationSection />
        <HowItWorks />
        <LiveWorship />
        <AnySize />
        <ExportSection />
        <Pricing />
        <MobileApp />
        <Vision />
        <OpenSource />
        <SupportTheMission />
        <Roadmap />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
