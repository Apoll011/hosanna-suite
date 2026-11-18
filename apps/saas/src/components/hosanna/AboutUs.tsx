import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/useReveal";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Palette } from "lucide-react";
import tiagoPhoto from "@/assets/tiago_headshot.webp";
import eberPhoto from "@/assets/eber_headshot.webp";

const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL + "/new";

function FounderCard({
  photo,
  name,
  role,
  bio,
  quote,
}: {
  photo: string;
  name: string;
  role: string;
  bio: string;
  quote: string;
}) {
  return (
    <div className="reveal rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 md:p-10 shadow-2xl text-white">
      <img
        src={photo}
        alt={name}
        className="h-20 w-20 rounded-full object-cover ring-2 ring-cyan-400/30"
      />
      <h3 className="mt-6 font-display text-2xl text-white">{name}</h3>
      <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">
        {role}
      </div>
      <p className="mt-4 text-base leading-relaxed text-white/80">{bio}</p>
      <p className="mt-5 border-l-2 border-cyan-400/50 pl-4 text-sm italic text-cyan-200">
        “{quote}”
      </p>
    </div>
  );
}

export function AboutUs() {
  useReveal();
  const { t } = useI18n();

  return (
    <div className="bg-transparent min-h-screen selection:bg-cyan-400/20 font-sans relative z-10 text-white">
      <section
        id="top"
        className="pt-52 md:pt-64 pb-16 md:pb-24 text-white overflow-hidden relative bg-transparent"
      >
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <h1 className="reveal text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display mb-8 tracking-tight">
            {t("about.heroTitleStart")}{" "}
            <span className="text-cyan-300">{t("about.heroTitleHighlight")}</span>
          </h1>
          <p className="reveal text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            {t("about.heroSubtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-transparent">
        <div className="mx-auto max-w-3xl px-6">
          <div className="reveal text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-4xl">
              {t("about.storyTitle")}
            </h2>
          </div>

          <div className="reveal mt-10 space-y-6 text-base sm:text-lg leading-relaxed text-white/80">
            <p>{t("about.storyP1")}</p>
            <p>{t("about.storyP2")}</p>
            <p>{t("about.storyP3")}</p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-transparent">
        <div className="mx-auto max-w-5xl px-6">
          <div className="reveal text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl leading-tight tracking-tight text-white md:text-4xl">
              {t("about.founderIntroTitle")}
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <FounderCard
              photo={tiagoPhoto}
              name={t("about.tiagoName")}
              role={t("about.tiagoRole")}
              bio={t("about.tiagoBio")}
              quote={t("about.tiagoQuote")}
            />
            <FounderCard
              photo={eberPhoto}
              name={t("about.eberName")}
              role={t("about.eberRole")}
              bio={t("about.eberBio")}
              quote={t("about.eberQuote")}
            />
          </div>

          <div className="reveal mt-10 flex justify-center gap-8 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-cyan-400" /> {t("about.tiagoRole")}
            </div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-cyan-400" /> {t("about.eberRole")}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-transparent">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="reveal font-display text-2xl leading-snug text-cyan-200 md:text-3xl italic">
            “{t("about.pullQuote")}”
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-transparent py-20 text-white md:py-28">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="reveal font-display text-3xl leading-tight tracking-tight md:text-5xl text-white">
            {t("about.ctaTitle")}
          </h2>
          <p className="reveal mx-auto mt-5 max-w-xl text-white/80 md:text-lg">
            {t("about.ctaSubtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row reveal">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-cyan-400 px-10 text-lg font-bold text-slate-950 shadow-xl transition-all hover:scale-105 active:scale-95 hover:bg-cyan-300"
            >
              <a href={dashboardUrl}>
                {t("about.ctaStart")} <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/25 bg-white/5 px-10 text-lg font-medium text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              <Link to="/contact">{t("about.ctaContact")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
