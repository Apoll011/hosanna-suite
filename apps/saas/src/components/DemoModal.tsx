import { useState } from 'react';
import type { LanguageCode } from './LanguageToggle';

interface DemoModalProps {
  open: boolean;
  language: LanguageCode;
  onClose: () => void;
  onStartWorkspace: () => void;
}

const KEYS = ['C', 'D', 'E', 'G', 'A'] as const;

const CHORD_TRANSPOSE: Record<
  (typeof KEYS)[number],
  { c1: string; c2: string; c3: string; c4: string }
> = {
  C: { c1: 'C', c2: 'G/B', c3: 'Am7', c4: 'Fmaj7' },
  D: { c1: 'D', c2: 'A/C#', c3: 'Bm7', c4: 'Gmaj7' },
  E: { c1: 'E', c2: 'B/D#', c3: 'C#m7', c4: 'Amaj7' },
  G: { c1: 'G', c2: 'D/F#', c3: 'Em7', c4: 'Cmaj7' },
  A: { c1: 'A', c2: 'E/G#', c3: 'F#m7', c4: 'Dmaj7' },
};

const DEMO_COPY: Record<
  LanguageCode,
  {
    badge: string;
    title: string;
    subtitle: string;
    keyLabel: string;
    line1: string;
    line2: string;
    cta: string;
  }
> = {
  pt: {
    badge: 'Demo Interativa',
    title: 'Smart Songbook + Service Flow',
    subtitle: 'Transposição instantânea em ChordPro e visualização limpa para toda a banda.',
    keyLabel: 'Tom',
    line1: 'Santo, Santo é o Senhor',
    line2: 'Toda a terra canta o Seu louvor',
    cta: 'Começar Agora',
  },
  en: {
    badge: 'Interactive Demo',
    title: 'Smart Songbook + Service Flow',
    subtitle: 'Instant ChordPro key transposition and clean stage view for your whole band.',
    keyLabel: 'Key',
    line1: 'Holy, Holy is the Lord',
    line2: 'All creation sings Your praise',
    cta: 'Get Started',
  },
  es: {
    badge: 'Demo Interactiva',
    title: 'Smart Songbook + Service Flow',
    subtitle: 'Transposición instantánea en ChordPro y vista limpia para todo el equipo.',
    keyLabel: 'Tono',
    line1: 'Santo, Santo es el Señor',
    line2: 'Toda la tierra canta Tu loor',
    cta: 'Empezar Ahora',
  },
};

export default function DemoModal({ open, language, onClose, onStartWorkspace }: DemoModalProps) {
  const [selectedKey, setSelectedKey] = useState<(typeof KEYS)[number]>('G');

  if (!open) return null;

  const copy = DEMO_COPY[language];
  const chords = CHORD_TRANSPOSE[selectedKey];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-dialog-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#021433]/75 px-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl border border-white/20 bg-[#021433]/95 backdrop-blur-md p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="inline-block text-[10px] font-medium uppercase tracking-[0.1em] text-[#14B8C4]">
              {copy.badge}
            </span>
            <h2 id="demo-dialog-title" className="mt-1 text-[18px] font-medium tracking-[-0.02em] text-white">
              {copy.title}
            </h2>
            <p className="mt-1 text-[13px] text-white/75 leading-[1.45]">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/65 hover:text-white text-[12px] font-medium px-2 py-1 cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/[0.05] p-4 mb-5">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/65">
              {copy.keyLabel}
            </span>
            <div className="flex items-center gap-1">
              {KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedKey(k)}
                  className={`w-[26px] h-[26px] rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                    selectedKey === k
                      ? 'bg-white text-[#0538A6]'
                      : 'bg-white/[0.08] text-white/75 hover:bg-white/[0.16] hover:text-white'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="font-mono text-[13px] leading-[1.6] space-y-2">
            <div>
              <div className="text-[#14B8C4] font-semibold flex gap-10">
                <span>{chords.c1}</span>
                <span>{chords.c2}</span>
              </div>
              <div className="text-white/95 font-sans">{copy.line1}</div>
            </div>
            <div>
              <div className="text-[#14B8C4] font-semibold flex gap-12">
                <span>{chords.c3}</span>
                <span>{chords.c4}</span>
              </div>
              <div className="text-white/95 font-sans">{copy.line2}</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onStartWorkspace();
          }}
          className="w-full h-[40px] rounded-full bg-white text-[#0538A6] text-[12px] font-semibold tracking-[0.02em] hover:bg-white/90 cursor-pointer transition-colors"
        >
          {copy.cta}
        </button>
      </div>
    </div>
  );
}
