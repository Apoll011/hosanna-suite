export function mergeLegacyFavorites({
  favorites,
  migrated,
  legacyFavorites,
}: {
  favorites: readonly string[];
  migrated: boolean;
  legacyFavorites: readonly string[];
}): { favorites: string[]; migrated: true } {
  if (migrated) return { favorites: [...favorites], migrated: true };
  return {
    favorites: favorites.length > 0 ? [...favorites] : [...legacyFavorites],
    migrated: true,
  };
}
