"use client";

import React from "react";
import Link from "next/link";
import styles from "./not-found.module.css";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Search size={64} strokeWidth={1.5} />
      </div>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>Página no encontrada</h2>
      <p className={styles.description}>
        Lo sentimos, no pudimos encontrar lo que buscabas. El restaurante puede no existir o la URL podría ser incorrecta.
      </p>
      <Link href="/" className={styles.button}>
        Volver al inicio
      </Link>
    </div>
  );
}
