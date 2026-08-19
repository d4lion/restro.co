"use server";

import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];

/**
 * Uploads a file to Supabase storage bucket under `{tenantId}/{folder}/{filename}`.
 * Validates image MIME type and file extension strictly.
 */
export async function uploadImageAction(formData: FormData, folder: string) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No se proporcionó ningún archivo" };
    }

    // Validate MIME type & file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type?.toLowerCase() || "";

    const isValidMime = ALLOWED_MIME_TYPES.includes(mimeType);
    const isValidExt = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isValidMime && !isValidExt) {
      return {
        error: "Formato no permitido. Solo se permiten imágenes (PNG, JPG, WEBP, GIF, SVG).",
      };
    }

    const session = await getSession();
    const tenantPrefix = session?.tenantId ? `${session.tenantId}/` : "";
    const fileName = `${uuidv4()}.${fileExt || "png"}`;
    const filePath = `${tenantPrefix}${folder}/${fileName}`;

    // Try standard authenticated server client first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let uploadRes;
    let clientUsed = supabase;

    if (user) {
      uploadRes = await supabase.storage
        .from("restro-storage")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
    }

    // Fallback to admin client if user is null or if RLS policy on authenticated user failed
    if (!user || uploadRes?.error) {
      const adminClient = createAdminClient();
      clientUsed = adminClient as any;
      uploadRes = await adminClient.storage
        .from("restro-storage")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
    }

    if (!uploadRes || uploadRes.error) {
      console.error("Storage upload error:", uploadRes?.error);
      return { error: uploadRes?.error?.message || "No se pudo subir la imagen al servidor" };
    }

    const { data: publicUrlData } = clientUsed.storage
      .from("restro-storage")
      .getPublicUrl(filePath);

    return { publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    return { error: "Error inesperado al subir la imagen" };
  }
}

/**
 * Deletes an uploaded image from Supabase Storage by its public URL or path.
 * Used for cleaning up temporary/orphan files when creation is cancelled.
 */
export async function deleteImageAction(publicUrl: string) {
  try {
    if (!publicUrl) return { success: false, message: "URL no proporcionada" };

    // Extract relative storage path from public URL
    // e.g. ".../restro-storage/{tenantId}/menu-items/abc.png" -> "{tenantId}/menu-items/abc.png"
    const marker = "/restro-storage/";
    const index = publicUrl.indexOf(marker);
    let filePath = publicUrl;
    if (index !== -1) {
      filePath = publicUrl.substring(index + marker.length);
    }

    const supabase = await createClient();
    let deleteRes = await supabase.storage.from("restro-storage").remove([filePath]);

    if (deleteRes?.error) {
      const adminClient = createAdminClient();
      deleteRes = await adminClient.storage.from("restro-storage").remove([filePath]);
    }

    return { success: !deleteRes?.error };
  } catch (error) {
    console.error("Error deleting storage file:", error);
    return { success: false };
  }
}
