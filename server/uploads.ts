import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { storagePut } from "./storage";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;

/** Legacy directory kept only so older /uploads references can still be served when present. */
export function uploadsDirectory() { return path.resolve(process.env.UPLOAD_DIR ?? "./uploads"); }
export function imageExtension(type: string) { return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg"; }

export function decodeImage(base64: string, mimeType: string) {
  if (!allowed.has(mimeType)) throw new Error("Use JPG, PNG ou WEBP.");
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
  const data = Buffer.from(cleanBase64, "base64");
  if (!data.length || data.length > maxBytes) throw new Error("A imagem deve ter no máximo 5 MB.");
  return data;
}

/**
 * New uploads go to the preconfigured persistent storage. The returned URL is
 * served by the platform and remains valid after deploys/restarts.
 */
export async function saveUploadedImage(base64: string, mimeType: string) {
  const data = decodeImage(base64, mimeType);
  const filename = `${randomUUID()}.${imageExtension(mimeType)}`;
  const hasPlatformStorage = Boolean(process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY);

  if (hasPlatformStorage) {
    const stored = await storagePut(`landing-assets/${filename}`, data, mimeType);
    return { path: stored.key, url: stored.url };
  }

  // Railway deployments use a persistent Volume mounted at /data.
  await mkdir(uploadsDirectory(), { recursive: true });
  await writeFile(path.join(uploadsDirectory(), filename), data, { flag: "wx" });
  return { path: filename, url: `/uploads/${filename}` };
}

/**
 * Compatibility helper for existing local files only. New code must use
 * saveUploadedImage so images are durable in shared storage.
 */
export async function saveLegacyLocalImage(base64: string, mimeType: string) {
  const data = decodeImage(base64, mimeType);
  const filename = `${randomUUID()}.${imageExtension(mimeType)}`;
  await mkdir(uploadsDirectory(), { recursive: true });
  await writeFile(path.join(uploadsDirectory(), filename), data, { flag: "wx" });
  return { path: filename, url: `/uploads/${filename}` };
}
