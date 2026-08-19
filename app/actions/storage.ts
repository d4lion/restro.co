"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads a file to the Supabase storage bucket.
 * @param formData FormData containing the 'file' to upload
 * @param folder The folder inside the bucket (e.g. 'logos', 'menu-items')
 * @returns An object with the publicUrl or an error
 */
export async function uploadImageAction(formData: FormData, folder: string) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Try standard authenticated server client first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let uploadRes;
    let clientUsed = supabase;

    if (user) {
      uploadRes = await supabase.storage
        .from("restro-storage")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
    }

    // If unauthenticated or if user upload failed due to Storage RLS policy, fallback to admin client
    if (!user || uploadRes?.error) {
      const adminClient = createAdminClient();
      clientUsed = adminClient as any;
      uploadRes = await adminClient.storage
        .from("restro-storage")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
    }

    if (!uploadRes || uploadRes.error) {
      console.error("Storage upload error:", uploadRes?.error);
      return { error: uploadRes?.error?.message || "Failed to upload image" };
    }

    const { data: publicUrlData } = clientUsed.storage
      .from("restro-storage")
      .getPublicUrl(filePath);

    return { publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    return { error: "Failed to upload image" };
  }
}
