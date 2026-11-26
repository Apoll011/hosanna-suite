// SPDX-License-Identifier: AGPL-3.0-only
import { env } from "@/lib/config/env";
import { storage } from "@/lib/storage";
import { createAuthImageStorage } from "./images";

export const authImages = createAuthImageStorage(storage, env.authUrl);
