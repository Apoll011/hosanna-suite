/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * @deprecated Prefer `useCatalogResource` / `useApplyProposal` from `../catalog`.
 */

import { useCatalogResource, useApplyProposal } from "../catalog/hooks";
import type { CatalogSong } from "../catalog/types";

export type CatalogSongState = {
  data: CatalogSong | null | undefined;
  isLoading: boolean;
  notFound: boolean;
  fromApi: boolean;
};

export function useCatalogSong(id: string | null | undefined): CatalogSongState {
  const state = useCatalogResource("song", id);
  return { ...state, fromApi: false };
}

export function useCatalogUpdateSong() {
  const apply = useApplyProposal();
  return async (args: { id: string; data: Partial<CatalogSong> }) => {
    await apply({
      kind: "song",
      entityId: args.id,
      payload: { content: args.data.content ?? "" },
      title: args.data.title,
    });
  };
}

export {
  useCatalogResource as useCatalogServiceResource,
  useApplyProposal as useCatalogUpdateService,
} from "../catalog/hooks";

export function useCatalogService(id: string | null | undefined) {
  return useCatalogResource("service", id);
}
