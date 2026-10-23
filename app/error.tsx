"use client";

import { useEffect } from "react";
import { ServiceUnavailable } from "@/components/errors/ServiceUnavailable";

export default function Error({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ServiceUnavailable
      title="Algo salió mal"
      description="Ocurrió un error inesperado. Puede ser un problema temporal de conexión; intenta de nuevo."
      onRetry={retry ?? reset}
    />
  );
}
