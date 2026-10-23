import Link from "next/link";
import { ServerCrash } from "lucide-react";
import styles from "./ServiceUnavailable.module.css";

interface Props {
  title?: string;
  description?: string;
  /** Optional retry action (client boundaries). Falls back to a reload link. */
  onRetry?: () => void;
}

export function ServiceUnavailable({
  title = "Servicio no disponible",
  description = "Estamos teniendo problemas para conectarnos con nuestros servidores. Por favor intenta de nuevo en unos minutos.",
  onRetry,
}: Props) {
  return (
    <main className={styles.container} role="alert">
      <div className={styles.iconWrapper}>
        <ServerCrash size={64} strokeWidth={1.5} />
      </div>
      <h1 className={styles.title}>503</h1>
      <h2 className={styles.subtitle}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.actions}>
        {onRetry ? (
          <button id="service-unavailable-retry" type="button" className={styles.button} onClick={onRetry}>
            Reintentar
          </button>
        ) : (
          <a id="service-unavailable-retry" href="" className={styles.button}>
            Reintentar
          </a>
        )}
        <Link id="service-unavailable-home" href="/" className={styles.secondary}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
