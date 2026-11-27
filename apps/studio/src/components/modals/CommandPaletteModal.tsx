import { CommandPalette } from "@hosanna/ui";

export function CommandPaletteModal({ isSearchingDb }: { isSearchingDb?: boolean }) {
  return <CommandPalette isSearching={isSearchingDb} />;
}
