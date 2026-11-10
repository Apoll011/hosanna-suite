import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!env.supabaseUrl || !env.supabaseSecretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required for avatar uploads");
  }
  client = createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { persistSession: false },
  });
  return client;
}

const AVATAR_BUCKET = "avatars";

export function isBase64Image(value: string): boolean {
  return (
    value.startsWith("data:image/") || /^[A-Za-z0-9+/=]{100,}/.test(value)
  );
}

export function isExternalImageUrl(value: string): boolean {
  if (!value.startsWith("http://") && !value.startsWith("https://")) return false;
  if (env.supabaseUrl && value.startsWith(env.supabaseUrl)) return false;
  return true;
}

export async function uploadBase64Avatar(userId: string, base64: string): Promise<string> {
  const supabase = getSupabase();
  const match = base64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  const contentType = match?.[1] ?? "image/png";
  const raw = match?.[2] ?? base64;
  const buffer = Buffer.from(raw, "base64");
  const ext = contentType.split("/")[1] ?? "png";
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error("[supabase] avatar upload failed:", error);
    throw error;
  }
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadUrlAvatar(userId: string, url: string): Promise<string> {
  const supabase = getSupabase();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch avatar URL (${res.status})`);
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = contentType.split("/")[1]?.split(";")[0] ?? "png";
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error("[supabase] avatar URL upload failed:", error);
    throw error;
  }
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
