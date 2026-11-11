import type { InstrumentProfile } from "./types";

/**
 * Central, modular registry of instrument profiles. Instruments register
 * themselves here (see `./index.ts` for the built-ins); consumers of the
 * library can also register their own custom instruments at runtime:
 *
 *   import { instrumentRegistry } from "@hosanna/chordpro/instruments";
 *   instrumentRegistry.register(myMandolinProfile);
 */
export class InstrumentRegistry {
  private instruments = new Map<string, InstrumentProfile<unknown>>();

  register<TShape>(instrument: InstrumentProfile<TShape>): void {
    this.instruments.set(instrument.id, instrument as InstrumentProfile<unknown>);
  }

  unregister(id: string): void {
    this.instruments.delete(id);
  }

  get<TShape = unknown>(id: string): InstrumentProfile<TShape> | undefined {
    return this.instruments.get(id) as InstrumentProfile<TShape> | undefined;
  }

  has(id: string): boolean {
    return this.instruments.has(id);
  }

  list(): InstrumentProfile<unknown>[] {
    return Array.from(this.instruments.values());
  }
}

/** Shared, app-wide instrument registry. */
export const instrumentRegistry = new InstrumentRegistry();
