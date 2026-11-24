// SPDX-License-Identifier: AGPL-3.0-only
import { Footer, Nav } from "@/components/hosanna/HosannaLanding";
import WebGLCanvas from "@/components/ui/WebGLCanvas";
import { useI18n, type Language } from "@/lib/i18n";

const pageCopy: Record<
  Language,
  { heading: string; subtitle: string; regionNote: string; lastUpdated: string }
> = {
  en: {
    heading: "Subprocessors",
    subtitle: "The service providers Hosanna uses to operate Hosanna Cloud.",
    regionNote:
      "These locations describe Hosanna's configured application, database, analytics, and Redis regions. They do not mean every provider operation, support process, network delivery, or provider-side subprocessor is restricted to that location. Provider data-processing terms govern additional processing and applicable international transfers.",
    lastUpdated: "Last updated: November 24, 2026",
  },
  pt: {
    heading: "Subcontratantes",
    subtitle: "Os fornecedores de serviços que a Hosanna utiliza para operar a Hosanna Cloud.",
    regionNote:
      "Estas localizações descrevem as regiões configuradas pela Hosanna para aplicações, base de dados, análise de utilização e Redis. Não significam que todas as operações, processos de suporte, entregas de rede ou subcontratantes dos fornecedores estejam limitados a essas localizações. O tratamento adicional e as transferências internacionais aplicáveis são regidos pelos termos de tratamento de dados dos fornecedores.",
    lastUpdated: "Última atualização: 24 de novembro de 2026",
  },
  es: {
    heading: "Subencargados",
    subtitle: "Los proveedores de servicios que Hosanna utiliza para operar Hosanna Cloud.",
    regionNote:
      "Estas ubicaciones describen las regiones configuradas por Hosanna para aplicaciones, base de datos, analítica y Redis. No significan que todas las operaciones, procesos de soporte, entregas de red o subencargados de los proveedores estén limitados a esas ubicaciones. El tratamiento adicional y las transferencias internacionales aplicables se rigen por las condiciones de tratamiento de datos de los proveedores.",
    lastUpdated: "Última actualización: 24 de noviembre de 2026",
  },
};

const subprocessors = [
  {
    name: "Vercel",
    purpose: "Application hosting and server functions",
    data: "Account, organization, authentication, request, and operational data handled by the hosted applications",
    region: "cdg1 (eu-west-3), Paris, France",
  },
  {
    name: "Supabase",
    purpose: "Primary database and private object storage",
    data: "Account, organization, membership, library, service, agenda, and settings data; avatar and organization logo files",
    region: "eu-west-1, Ireland",
  },
  {
    name: "PostHog",
    purpose: "Product analytics for Studio and Auth",
    data: "User and organization identifiers and product usage events",
    region: "EU Cloud, Frankfurt, Germany",
  },
  {
    name: "Redis Cloud",
    purpose: "Authentication secondary storage, rate limits, and application caches",
    data: "Session state, rate-limit state, and cache entries",
    region: "eu-west-3, Paris, France",
  },
];

export function Component() {
  const { language } = useI18n();
  const copy = pageCopy[language];

  return (
    <>
      <WebGLCanvas showTextLayer={false} />
      <div className="relative z-10 min-h-screen bg-transparent font-sans text-white antialiased selection:bg-cyan-400/20">
        <Nav />
        <section className="relative overflow-hidden bg-transparent pb-12 pt-52 text-white md:pt-60">
          <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              {copy.heading}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              {copy.subtitle}
            </p>
          </div>
        </section>

        <section className="bg-transparent py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-5 md:px-8">
            <p className="mb-6 text-sm text-white/60">{copy.lastUpdated}</p>
            <div className="grid gap-5 md:grid-cols-2">
              {subprocessors.map((provider) => (
                <article
                  key={provider.name}
                  className="rounded-3xl border border-white/15 bg-slate-900/60 p-7 text-white shadow-2xl backdrop-blur-md md:p-9"
                >
                  <h2 className="font-display text-2xl text-white">{provider.name}</h2>
                  <dl className="mt-5 space-y-4 text-sm leading-relaxed">
                    <div>
                      <dt className="font-semibold text-white">Purpose</dt>
                      <dd className="mt-1 text-white/75">{provider.purpose}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-white">Data processed</dt>
                      <dd className="mt-1 text-white/75">{provider.data}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-white">Configured region</dt>
                      <dd className="mt-1 text-white/75">{provider.region}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <p className="mt-8 rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-sm leading-relaxed text-white/70">
              {copy.regionNote}
            </p>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}
