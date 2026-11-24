// SPDX-License-Identifier: AGPL-3.0-only
import ReactMarkdown from "react-markdown";

import ppContentEn from "@/content/pp.en.md?raw";
import ppContentEs from "@/content/pp.es.md?raw";
import ppContentPt from "@/content/pp.pt.md?raw";

import { Footer, Nav } from "@/components/hosanna/HosannaLanding";
import WebGLCanvas from "@/components/ui/WebGLCanvas";
import { useI18n, type Language } from "@/lib/i18n";

const ppDocuments: Record<Language, string> = {
  pt: ppContentPt,
  en: ppContentEn,
  es: ppContentEs,
};

const ppMeta: Record<Language, { heading: string; subtitle: string }> = {
  pt: {
    heading: "Política de Privacidade",
    subtitle:
      "Como protegemos os teus dados, a privacidade da tua igreja e os dados da conta Google.",
  },
  en: {
    heading: "Privacy Policy",
    subtitle: "How we protect your data, your church's privacy, and Google account data.",
  },
  es: {
    heading: "Política de Privacidad",
    subtitle:
      "Cómo protegemos tus datos, la privacidad de tu iglesia y los datos de la cuenta de Google.",
  },
};

export function Component() {
  const { language } = useI18n();
  const currentLang = (language in ppDocuments ? language : "pt") as Language;
  const content = ppDocuments[currentLang] || ppDocuments.pt;
  const meta = ppMeta[currentLang] || ppMeta.pt;

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
