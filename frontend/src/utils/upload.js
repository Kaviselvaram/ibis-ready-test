import { api } from "../api/ApiClient";
import { supabase } from "../lib/supabaseClient";

// Upload a file to Supabase Storage via a backend-issued signed URL, and return
// its stable public URL. `kind` is "thumbnail" or "note".
export async function uploadFile(file, kind) {
  if (!supabase) throw new Error("File storage isn’t configured.");
  const { path, token, publicUrl } = await api.post("/content/upload-url", { kind, filename: file.name });
  const { error } = await supabase.storage.from("content").uploadToSignedUrl(path, token, file);
  if (error) throw new Error(error.message || "Upload failed.");
  return publicUrl;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
export const MAX_PDF_BYTES = 25 * 1024 * 1024;    // 25 MB
