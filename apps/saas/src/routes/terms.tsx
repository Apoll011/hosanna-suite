// SPDX-License-Identifier: AGPL-3.0-only
import ReactMarkdown from "react-markdown";

import tosContentEn from "@/content/tos.en.md?raw";
import tosContentEs from "@/content/tos.es.md?raw";
import tosContentPt from "@/content/tos.pt.md?raw";

import { Footer, Nav } from "@/components/hosanna/HosannaLanding";
import WebGLCanvas from "@/components/ui/WebGLCanvas";
import { useI18n, type Language } from "@/lib/i18n";

const tosDocuments: Record<Language, string> = {
  pt: tosContentPt,
  en: tosContentEn,
  es: tosContentEs,
};

const tosMeta: Record<Language, { heading: string; subtitle: string }> = {
  pt: {
    heading: "Termos de Serviço",
    subtitle: "Os termos e condições de utilização da plataforma e aplicações Hosanna.",
  },
  en: {
    heading: "Terms of Service",
    subtitle: "Terms and conditions for using Hosanna applications and services.",
  },
  es: {
    heading: "Términos de Servicio",
    subtitle: "Los términos y condiciones de uso de la plataforma y aplicaciones Hosanna.",
  },
};

export function Component() {
  const { language } = useI18n();
  const currentLang = (language in tosDocuments ? language : "pt") as Language;
  const content = tosDocuments[currentLang] || tosDocuments.pt;
  const meta = tosMeta[currentLang] || tosMeta.pt;

  return (
    <>
      <WebGLCanvas showTextLayer={false} />
      <div className="min-h-screen bg-transparent font-sans text-white antialiased selection:bg-cyan-400/20 relative z-10">
        <Nav />
        <section
          id="top"
          className="pt-52 md:pt-60 pb-12 text-white overflow-hidden relative bg-transparent"
        >
          <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              {meta.heading}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              {meta.subtitle}
            </p>
          </div>
        </section>

        <section className="bg-transparent py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-5 md:px-8">
            <div className="rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-md p-8 md:p-12 text-white shadow-2xl">
              <div className="prose prose-invert prose-headings:font-display prose-headings:text-white prose-p:text-white/80 prose-a:text-cyan-300 hover:prose-a:text-cyan-200 max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}
