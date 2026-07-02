import { randomUUID } from "crypto";
import { getServiceSupabase } from "../config/supabase.js";

const BUCKET = "content";
const FOLDERS = { thumbnail: "thumbnails", note: "notes" };

const sanitize = (name) =>
  String(name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-60) || "file";

export class UploadService {
  // Issues a short-lived signed upload URL the client PUTs the file to directly,
  // plus the stable public URL to store on the resource afterwards.
  static async createSignedUploadUrl(kind, filename) {
    const folder = FOLDERS[kind] || "misc";
    const path = `${folder}/${randomUUID()}-${sanitize(filename)}`;
    const supabase = getServiceSupabase();

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw new Error(`createSignedUploadUrl failed: ${error.message}`);

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return { path, token: data.token, signedUrl: data.signedUrl, publicUrl: pub.publicUrl };
  }

  // Best-effort removal of a stored object by its public URL (used on replace/delete).
  static async removeByPublicUrl(publicUrl) {
    if (!publicUrl) return;
    const marker = `/object/public/${BUCKET}/`;
    const idx = String(publicUrl).indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
    const supabase = getServiceSupabase();
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
  }
}
