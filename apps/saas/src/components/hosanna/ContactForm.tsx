import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/useReveal";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

const CONTACT_EMAIL = "hosanna.songbook@gmail.com";

const SUBJECT_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "technical", labelKey: "contact.subjectTechnical" },
  { value: "feature", labelKey: "contact.subjectFeature" },
  { value: "pricing", labelKey: "contact.subjectPricing" },
  { value: "partnership", labelKey: "contact.subjectPartnership" },
  { value: "other", labelKey: "contact.subjectOther" },
];

export function ContactForm() {
  useReveal();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [church, setChurch] = useState("");
  const [email, setEmail] = useState("");
  const [subjectValue, setSubjectValue] = useState(SUBJECT_OPTIONS[0].value);
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subjectOption =
      SUBJECT_OPTIONS.find((option) => option.value === subjectValue) ?? SUBJECT_OPTIONS[0];
    const subjectLabel = t(subjectOption.labelKey);
    const body = [
      `Name: ${name.trim() || "(not provided)"}`,
      `Church: ${church.trim() || "(not provided)"}`,
      `Reply-to: ${email.trim() || "(not provided)"}`,
      "",
      message.trim(),
    ].join("\n");

    const mailto = new URL(`mailto:${CONTACT_EMAIL}`);
    mailto.searchParams.set("subject", `[Hosanna] ${subjectLabel}`);
    mailto.searchParams.set("body", body);
    window.location.href = mailto.toString();
  };

  return (
    <div className="bg-transparent min-h-screen selection:bg-cyan-400/20 font-sans relative z-10 text-white">
      <section
        id="top"
        className="pt-52 md:pt-64 pb-16 md:pb-24 text-white overflow-hidden relative bg-transparent"
      >
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <h1 className="reveal text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display mb-8 tracking-tight">
            {t("contact.heroTitle")}{" "}
            <span className="text-cyan-300">{t("contact.heroTitleHighlight")}</span>
          </h1>
          <p className="reveal text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            {t("contact.heroSubtitle")}
          </p>
        </div>
      </section>

      <section className="p-8 sm:p-12 md:p-16 relative z-20 bg-transparent">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="space-y-8 reveal">
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                  {t("contact.alwaysReadyTitle")}
                </h2>
                <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-lg">
                  {t("contact.alwaysReadyDesc")}
                </p>
              </div>

              <div className="grid gap-6">
                <div className="flex items-start gap-5 p-6 rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md">
                  <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-white">
                      {t("contact.emailTitle")}
                    </h3>
                    <p className="text-cyan-300 text-base sm:text-lg break-all">
                      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">
                      {t("contact.emailResponseTime")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 p-6 rounded-2xl border border-white/15 bg-slate-900/60 backdrop-blur-md">
                  <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-white">
                      {t("contact.socialTitle")}
                    </h3>
                    <p className="text-white/80 text-base">@hosanna.studio</p>
                    <div className="flex gap-5 mt-3 text-sm font-semibold text-cyan-300">
                      <a
                        href="https://www.instagram.com/hosanna.studio"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        Instagram
                      </a>
                      <a
                        href="https://www.youtube.com/@hosanna.studio"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        YouTube
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/15 rounded-2xl bg-slate-900/40 backdrop-blur-md">
                <h4 className="font-display font-bold text-lg mb-2 text-white">
                  {t("common.activeDevelopment")}
                </h4>
                <p className="text-white/75 text-sm leading-relaxed">{t("common.activeDevDesc")}</p>
              </div>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 lg:p-12 rounded-3xl shadow-2xl border border-white/15 reveal text-white">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-name"
                      className="text-xs font-bold uppercase tracking-wider text-cyan-200"
                    >
                      {t("contact.nameLabel")}
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("contact.namePlaceholder")}
                      className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-church"
                      className="text-xs font-bold uppercase tracking-wider text-cyan-200"
                    >
                      {t("contact.churchLabel")}
                    </label>
                    <input
                      id="contact-church"
                      name="church"
                      type="text"
                      value={church}
                      onChange={(e) => setChurch(e.target.value)}
                      placeholder={t("contact.churchPlaceholder")}
                      className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="contact-email"
                    className="text-xs font-bold uppercase tracking-wider text-cyan-200"
                  >
                    {t("contact.emailLabel")}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("contact.emailPlaceholder")}
                    className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="contact-subject"
                    className="text-xs font-bold uppercase tracking-wider text-cyan-200"
                  >
                    {t("contact.subjectLabel")}
                  </label>
                  <div className="relative">
                    <select
                      id="contact-subject"
                      name="subject"
                      value={subjectValue}
                      onChange={(e) => setSubjectValue(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl bg-slate-900 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all appearance-none text-base"
                    >
                      {SUBJECT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-cyan-300">
                      <Send className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="contact-message"
                    className="text-xs font-bold uppercase tracking-wider text-cyan-200"
                  >
                    {t("contact.messageLabel")}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("contact.messagePlaceholder")}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400 outline-none resize-none transition-all text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  {t("contact.sendButton")}
                  <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-center text-xs text-white/60 mt-2 leading-relaxed">
                  {t("contact.termsConsent")}{" "}
                  <Link to="/privacy" className="underline hover:text-white text-cyan-200">
                    {t("common.privacyPolicy")}
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
