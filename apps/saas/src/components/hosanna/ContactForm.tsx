import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useReveal } from "@/hooks/useReveal";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { StaffLines } from "./HosannaLanding";

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
    <div className="bg-[#f8fafc] min-h-screen selection:bg-primary/10 font-sans">
      <section className="bg-hero-gradient pt-40 pb-12 text-white overflow-hidden relative -mt-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 text-white/10">
          <StaffLines className="top-24 opacity-40" />
          <StaffLines className="bottom-12 opacity-20" />
        </div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="reveal inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-blue-200 border border-white/10">
              {t("contact.eyebrow")}
            </div>
            <LanguageSelector />
          </div>
          <h1 className="reveal text-5xl md:text-7xl lg:text-8xl font-display mb-8 tracking-tight">
            {t("contact.heroTitle")}{" "}
            <span className="text-blue-300">{t("contact.heroTitleHighlight")}</span>
          </h1>
          <p className="reveal text-lg md:text-xl text-blue-50/80 leading-relaxed max-w-2xl mx-auto">
            {t("contact.heroSubtitle")}
          </p>
        </div>
      </section>

      <section className="p-12 md:p-16 relative z-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="space-y-10 reveal">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-primary tracking-tight">
                  {t("contact.alwaysReadyTitle")}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  {t("contact.alwaysReadyDesc")}
                </p>
              </div>

              <div className="grid gap-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-lg border border-border text-primary shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-primary">
                      {t("contact.emailTitle")}
                    </h3>
                    <p className="text-muted-foreground text-lg break-all">
                      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("contact.emailResponseTime")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-lg border border-border text-primary shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-primary">
                      {t("contact.socialTitle")}
                    </h3>
                    <p className="text-muted-foreground text-lg">@hosanna.studio</p>
                    <div className="flex gap-6 mt-3 text-base font-semibold text-primary">
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

              <div className="p-8 border border-border rounded-lg">
                <h4 className="font-display font-bold text-xl mb-4 text-primary">
                  {t("common.activeDevelopment")}
                </h4>
                <p className="text-muted-foreground leading-relaxed">{t("common.activeDevDesc")}</p>
              </div>
            </div>
            <div className="bg-white p-8 md:p-10 lg:p-12 rounded-3xl shadow-soft border border-blue-50 reveal">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label
                      htmlFor="contact-name"
                      className="text-sm font-bold ml-1 uppercase tracking-widest text-muted-foreground"
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
                      className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none text-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <label
                      htmlFor="contact-church"
                      className="text-sm font-bold ml-1 uppercase tracking-widest text-muted-foreground"
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
                      className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="contact-email"
                    className="text-sm font-bold ml-1 uppercase tracking-widest text-muted-foreground"
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
                    className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="contact-subject"
                    className="text-sm font-bold ml-1 uppercase tracking-widest text-muted-foreground"
                  >
                    {t("contact.subjectLabel")}
                  </label>
                  <div className="relative">
                    <select
                      id="contact-subject"
                      name="subject"
                      value={subjectValue}
                      onChange={(e) => setSubjectValue(e.target.value)}
                      className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none appearance-none text-lg"
                    >
                      {SUBJECT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <Send className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-bold ml-1 uppercase tracking-widest text-muted-foreground"
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
                    className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none resize-none text-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 rounded-2xl bg-primary text-white font-bold text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  {t("contact.sendButton")}
                  <Send className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t("contact.termsConsent")}{" "}
                  <Link to="/privacy" className="underline hover:text-foreground">
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
