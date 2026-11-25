import React from "react";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/admin-auth";
import { Toaster } from "sonner";
import styles from "./layout.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restro Command Center",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function ObfuscatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If not logged in, redirect to login with return path
  if (!session) {
    redirect("/login?redirect=/a/g/s");
  }

  // Strict Security Check:
  // If the user is NOT a Super Administrator, return 404 (Not Found)
  // This prevents malicious actors from knowing this obfuscated path exists.
  if (!isSuperAdmin(session)) {
    notFound();
  }

  return (
    <div className={styles.shell}>
      {children}

      {/* Realtime Toaster */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-display)",
            fontSize: "0.875rem",
            border: "1.5px solid #CBD5E1",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(15,23,42,0.12)",
          },
        }}
        richColors
        closeButton
      />
    </div>
  );
}
