// SPDX-License-Identifier: AGPL-3.0-only
import { prisma } from "./database/prisma.js";

export type PrismaTransactionalClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
