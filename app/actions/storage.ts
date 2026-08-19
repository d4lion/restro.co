"use server";

import { createClient } from "@/lib/supabase/server";
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

    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("restro-storage")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("restro-storage")
      .getPublicUrl(filePath);

    return { publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    return { error: "Failed to upload image" };
  }
}
