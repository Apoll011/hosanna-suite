import { createCache } from "@hosanna/cache";

type PublishPhase = "service_saved" | "agenda_saved" | "verified";

export type PublishProgress = {
  at: number;
  phase: PublishPhase;
  serviceId: string;
  serviceUpdatedAt: string;
  eventId?: string;
  eventUpdatedAt?: string;
};

export type PublishProgressInput = Omit<PublishProgress, "at">;

const TTL_MS = 30 * 60 * 1000;
const progress = createCache({ namespace: "mcp:publish", ttlMs: TTL_MS });
const completed = createCache({ namespace: "mcp:publish-done", ttlMs: TTL_MS });

function progressKey(orgId: string, clientRequestId: string) {
  return `${orgId}:${clientRequestId.trim()}`;
}

export async function getPublishProgress(
  orgId: string,
  clientRequestId: string,
): Promise<PublishProgress | undefined> {
  return progress.get<PublishProgress>(progressKey(orgId, clientRequestId));
}

export async function setPublishProgress(
  orgId: string,
  clientRequestId: string,
  value: PublishProgressInput,
): Promise<void> {
  await progress.set(progressKey(orgId, clientRequestId), {
    ...value,
    at: Date.now(),
  });
}

export async function clearPublishProgress(orgId: string, clientRequestId: string): Promise<void> {
  await progress.delete(progressKey(orgId, clientRequestId));
}

export async function getCompletedPublish(
  orgId: string,
  clientRequestId: string,
): Promise<unknown | undefined> {
  return completed.get(progressKey(orgId, clientRequestId));
}

export async function setCompletedPublish(
  orgId: string,
  clientRequestId: string,
  result: unknown,
): Promise<void> {
  await completed.set(progressKey(orgId, clientRequestId), result);
  await clearPublishProgress(orgId, clientRequestId);
}
