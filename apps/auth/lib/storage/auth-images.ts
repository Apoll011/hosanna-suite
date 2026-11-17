import { env } from "@/lib/config/env";
import { storage } from "@/lib/storage";
import { createAuthImageStorage } from "./images";

export const authImages = createAuthImageStorage(storage, env.authUrl);
