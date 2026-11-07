import { ChordProImportProvider } from "./chordpro";
import { JsonImportProvider } from "./json";
import { SongImportRegistry } from "./registry";

export const songImportRegistry = new SongImportRegistry();

songImportRegistry.register(new ChordProImportProvider());
songImportRegistry.register(new JsonImportProvider());
