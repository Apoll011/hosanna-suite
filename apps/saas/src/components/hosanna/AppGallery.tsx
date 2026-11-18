import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import songLibraryImg from "@/assets/song_library.jpeg";
import serviceImg from "@/assets/service.jpeg";
import chordsImg from "@/assets/chords.jpeg";
import transposeImg from "@/assets/transpose.jpeg";

export interface GalleryPhoto {
  id: number;
  image: string;
  caption: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export default function AppGallery() {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const galleryPhotos: GalleryPhoto[] = [
    { id: 1, image: songLibraryImg, caption: t("landing.gallery.captions.songLibrary") },
    { id: 2, image: serviceImg, caption: t("landing.gallery.captions.servicePlanner") },
    { id: 3, image: chordsImg, caption: t("landing.gallery.captions.liveChordView") },
    { id: 4, image: transposeImg, caption: t("landing.gallery.captions.transpose") },
  ];

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (trackRef.current) {
            const rect = trackRef.current.getBoundingClientRect();
            const totalScrollable = rect.height - window.innerHeight;
            if (totalScrollable > 0) {
              const scrolled = -rect.top;
              const p = clamp(scrolled / totalScrollable, 0, 1);
              setScrollProgress(p);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeIndex =
    scrollProgress < 0.25 ? 0 : scrollProgress < 0.5 ? 1 : scrollProgress < 0.75 ? 2 : 3;

  return (
    // 400vh tall so there's enough scroll room for the sticky panel + 4 photo wipes.
    // [overflow-x:clip] prevents lateral bleed without breaking position:sticky.
    <section
      ref={trackRef}
      className="relative z-10 h-[400vh] w-full bg-transparent font-sans [overflow-x:clip]"
      aria-label={t("landing.gallery.title")}
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center px-4 md:px-8">
        <div className="mx-auto max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* Context text + 4-dot indicator */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left z-10">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* 4-dot vertical progress indicator */}
              <div
                className="hidden sm:flex flex-col gap-2.5 pt-2 shrink-0"
                aria-label="Gallery slide progress"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        isActive
                          ? "w-2 h-7 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                          : "w-2 h-2 bg-white/25",
                      )}
                    />
                  );
                })}
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  {t("landing.gallery.title")}
                </h2>
                <p className="mt-3 text-sm sm:text-base md:text-lg text-white/75 leading-relaxed max-w-md">
                  {t("landing.gallery.description")}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold tracking-widest text-cyan-300 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                    0{activeIndex + 1} / 04
                  </span>
                  <span className="text-sm sm:text-base font-medium text-white transition-opacity duration-300">
                    {galleryPhotos[activeIndex].caption}
                  </span>
                </div>

                {/* Mobile progress dots */}
                <div className="flex sm:hidden gap-2 mt-4 items-center">
                  {[0, 1, 2, 3].map((idx) => {
                    const isActive = activeIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-full transition-all duration-300",
                          isActive
                            ? "w-6 h-1.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                            : "w-1.5 h-1.5 bg-white/25",
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Portrait photo frame.
              On mobile: explicit width drives the aspect-ratio height.
              On md+: explicit height drives the aspect-ratio width. */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end items-center">
            <div
              className="relative z-10 overflow-hidden rounded-3xl border border-white/20 bg-slate-950/40 backdrop-blur-md shadow-2xl pointer-events-none select-none
                         w-[min(72vw,280px)] md:w-auto md:h-[min(72vh,560px)]"
              style={{ aspectRatio: "3/4" }}
            >
              {galleryPhotos.map((photo, i) => {
                let translateY = "0%";
                if (i === 1) {
                  const factor = clamp((scrollProgress - 0.2) / 0.08, 0, 1);
                  translateY = `${(1 - factor) * 100}%`;
                } else if (i === 2) {
                  const factor = clamp((scrollProgress - 0.45) / 0.08, 0, 1);
                  translateY = `${(1 - factor) * 100}%`;
                } else if (i === 3) {
                  const factor = clamp((scrollProgress - 0.7) / 0.08, 0, 1);
                  translateY = `${(1 - factor) * 100}%`;
                }

                return (
                  <div
                    key={photo.id}
                    className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
                    style={{
                      transform: i === 0 ? "none" : `translateY(${translateY})`,
                      zIndex: i + 1,
                    }}
                  >
                    <img
                      src={photo.image}
                      alt={photo.caption}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
