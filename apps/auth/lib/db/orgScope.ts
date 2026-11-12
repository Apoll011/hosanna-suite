import { prisma } from "@/lib/db/prisma";

const ORG_SCOPED_MODELS = new Set([
  "Folder",
  "Collection",
  "Song",
  "Service",
  "ServiceNote",
  "AgendaEvent",
  "Settings",
]);

const orgClientCache = new Map<string, ReturnType<typeof buildOrgClient>>();
const ORG_CACHE_MAX = 512;

function buildOrgClient(orgId: string) {
  return prisma.$extends({
    name: `tenant-scope`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !ORG_SCOPED_MODELS.has(model)) {
            return query(args);
          }
          switch (operation) {
            case "findUnique":
            case "findUniqueOrThrow":
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "updateMany":
            case "deleteMany":
            case "count":
            case "aggregate":
            case "groupBy": {
              (args as any).where = { ...((args as any).where ?? {}), orgId };
              return query(args);
            }
            case "update":
            case "delete": {
              (args as any).where = { ...(args as any).where, orgId };
              return query(args);
            }
            case "upsert": {
              (args as any).where = { ...(args as any).where, orgId };
              (args as any).create = { ...(args as any).create, orgId };
              return query(args);
            }
            case "create": {
              (args as any).data = { ...(args as any).data, orgId };
              return query(args);
            }
            case "createMany": {
              const data = (args as any).data;
              (args as any).data = Array.isArray(data)
                ? data.map((d: any) => ({ ...d, orgId }))
                : { ...data, orgId };
              return query(args);
            }
            default:
              return query(args);
          }
        },
      },
    },
  });
}

export function forOrganization(orgId: string) {
  const cached = orgClientCache.get(orgId);
  if (cached) return cached;

  if (orgClientCache.size >= ORG_CACHE_MAX) {
    orgClientCache.delete(orgClientCache.keys().next().value!);
  }

  const client = buildOrgClient(orgId);
  orgClientCache.set(orgId, client);
  return client;
}

export type OrgScopedPrisma = ReturnType<typeof forOrganization>;
