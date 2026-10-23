/**
 * Waiter Handoff QR (plan CARTA_DIGITAL $9.900)
 *
 * Un cliente que escaneó el QR físico de una mesa arma un carrito virtual y genera un QR
 * con un JSON COMPACTO (solo IDs) que le muestra al mesero. No se guarda nada en la BD:
 * el QR es el único portador de la información.
 *
 * Por qué solo IDs: un QR tiene capacidad limitada (~2.9 KB). Los nombres y precios los
 * resuelve el lado del mesero contra el menú real del tenant, lo que además evita que un
 * cliente manipule precios dentro del QR.
 */

export const WAITER_QR_VERSION = 1;
/** Margen seguro de caracteres para un QR con corrección de errores "M" (~2331 bytes). */
export const WAITER_QR_MAX_CHARS = 2000;

export type WaiterQrItemTuple = [itemId: string, qty: number, optionIds: string[]];

export interface WaiterQrPayload {
  v: typeof WAITER_QR_VERSION;
  /** tenantId */
  t: string;
  /** tableId */
  m: string;
  /** Epoch ms de creación */
  c: number;
  /** Notas opcionales del cliente */
  n?: string;
  /** Ítems: [menuItemId, cantidad, [optionIds]] */
  i: WaiterQrItemTuple[];
}

export interface WaiterQrCartLine {
  quantity: number;
  selections: Record<string, string[]>;
  menuItem: { id: string };
}

export interface BuildWaiterQrInput {
  tenantId: string;
  tableId: string;
  notes?: string;
  cart: WaiterQrCartLine[];
}

const MAX_NOTES_CHARS = 140;

export function buildWaiterQrPayload(input: BuildWaiterQrInput): WaiterQrPayload {
  const items: WaiterQrItemTuple[] = input.cart.map((line) => {
    const optionIds = Object.values(line.selections).flat();
    return [line.menuItem.id, Math.max(1, Math.floor(line.quantity)), optionIds];
  });

  const notes = input.notes?.trim().slice(0, MAX_NOTES_CHARS);

  return {
    v: WAITER_QR_VERSION,
    t: input.tenantId,
    m: input.tableId,
    c: Date.now(),
    ...(notes ? { n: notes } : {}),
    i: items,
  };
}

export function serializeWaiterQrPayload(payload: WaiterQrPayload): string {
  return JSON.stringify(payload);
}

/** True si el JSON cabe cómodamente en un QR escaneable. */
export function fitsInWaiterQr(payload: WaiterQrPayload): boolean {
  return serializeWaiterQrPayload(payload).length <= WAITER_QR_MAX_CHARS;
}

/**
 * Parsea y valida un QR escaneado (lo usará la vista del mesero más adelante).
 * Devuelve null si no es un QR de Restro válido.
 */
export function parseWaiterQrPayload(raw: string): WaiterQrPayload | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const p = JSON.parse(raw) as Partial<WaiterQrPayload>;
    if (
      p.v !== WAITER_QR_VERSION ||
      typeof p.t !== "string" ||
      typeof p.m !== "string" ||
      typeof p.c !== "number" ||
      !Array.isArray(p.i) ||
      p.i.length === 0
    ) {
      return null;
    }
    const valid = p.i.every(
      (row) =>
        Array.isArray(row) &&
        typeof row[0] === "string" &&
        typeof row[1] === "number" &&
        row[1] > 0 &&
        Array.isArray(row[2]) &&
        row[2].every((o) => typeof o === "string")
    );
    return valid ? (p as WaiterQrPayload) : null;
  } catch {
    return null;
  }
}

/** Lee el identificador de mesa de la query string (mismos alias que usa CartDrawer). */
export function getTableParamFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return (
    params.get("table") ||
    params.get("tableId") ||
    params.get("table_id") ||
    params.get("mesa") ||
    params.get("qr") ||
    params.get("t") ||
    null
  );
}

/** Genera el PNG (data URL) del QR. `qrcode` se importa dinámicamente para no inflar el bundle. */
export async function generateWaiterQrDataUrl(payload: WaiterQrPayload): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(serializeWaiterQrPayload(payload), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
}
