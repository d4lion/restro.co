import React from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#f1f5f9ff", minHeight: "100vh", color: "#0F172A", width: "100%" }}>
      {children}
    </div>
  );
}
