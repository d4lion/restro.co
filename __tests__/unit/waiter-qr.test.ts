import { describe, it, expect } from "vitest";
import {
  buildWaiterQrPayload,
  serializeWaiterQrPayload,
  parseWaiterQrPayload,
  fitsInWaiterQr,
  getTableParamFromSearch,
  generateWaiterQrDataUrl,
  WAITER_QR_MAX_CHARS,
} from "@/lib/waiter-qr";

const line = (id: string, quantity: number, selections: Record<string, string[]> = {}) => ({
  quantity,
  selections,
  menuItem: { id },
});

describe("waiter-qr payload", () => {
  it("builds a compact ID-only payload (no names or prices)", () => {
    const payload = buildWaiterQrPayload({
      tenantId: "tenant_1",
      tableId: "table_4",
      notes: "  sin cebolla  ",
      cart: [
        line("item_a", 2, { grp1: ["opt_1"], grp2: ["opt_2", "opt_3"] }),
        line("item_b", 1),
      ],
    });

    expect(payload.v).toBe(1);
    expect(payload.t).toBe("tenant_1");
    expect(payload.m).toBe("table_4");
    expect(payload.n).toBe("sin cebolla");
    expect(payload.i).toEqual([
      ["item_a", 2, ["opt_1", "opt_2", "opt_3"]],
      ["item_b", 1, []],
    ]);
    expect(serializeWaiterQrPayload(payload)).not.toMatch(/price|name/i);
  });

  it("round-trips through serialize and parse", () => {
    const payload = buildWaiterQrPayload({
      tenantId: "t",
      tableId: "m",
      cart: [line("x", 3, { g: ["o"] })],
    });
    expect(parseWaiterQrPayload(serializeWaiterQrPayload(payload))).toEqual(payload);
  });

  it("rejects malformed, empty or foreign QR content", () => {
    expect(parseWaiterQrPayload("")).toBeNull();
    expect(parseWaiterQrPayload("https://restro.adamind.cloud/mesa")).toBeNull();
    expect(parseWaiterQrPayload(JSON.stringify({ v: 2, t: "a", m: "b", c: 1, i: [["x", 1, []]] }))).toBeNull();
    expect(parseWaiterQrPayload(JSON.stringify({ v: 1, t: "a", m: "b", c: 1, i: [] }))).toBeNull();
    expect(parseWaiterQrPayload(JSON.stringify({ v: 1, t: "a", m: "b", c: 1, i: [["x", 0, []]] }))).toBeNull();
  });

  it("flags carts too large for a single scannable QR", () => {
    const small = buildWaiterQrPayload({ tenantId: "t", tableId: "m", cart: [line("x", 1)] });
    expect(fitsInWaiterQr(small)).toBe(true);

    const huge = buildWaiterQrPayload({
      tenantId: "clx0000000000000000000000",
      tableId: "clx0000000000000000000001",
      cart: Array.from({ length: 40 }, (_, i) =>
        line(`clx${String(i).padStart(22, "0")}`, 1, { g: ["clx00000000000000000000a1", "clx00000000000000000000a2"] })
      ),
    });
    expect(serializeWaiterQrPayload(huge).length).toBeGreaterThan(WAITER_QR_MAX_CHARS);
    expect(fitsInWaiterQr(huge)).toBe(false);
  });

  it("reads the table param using every supported alias", () => {
    expect(getTableParamFromSearch("?table=abc")).toBe("abc");
    expect(getTableParamFromSearch("?mesa=m1&x=1")).toBe("m1");
    expect(getTableParamFromSearch("?qr=tok")).toBe("tok");
    expect(getTableParamFromSearch("?activeProductView=x")).toBeNull();
    expect(getTableParamFromSearch("")).toBeNull();
  });

  it("renders a PNG data URL for a realistic order", async () => {
    const payload = buildWaiterQrPayload({
      tenantId: "clx0000000000000000000000",
      tableId: "clx0000000000000000000001",
      cart: Array.from({ length: 8 }, (_, i) => line(`clx${String(i).padStart(22, "0")}`, 2, { g: ["clx00000000000000000000a1"] })),
    });
    const url = await generateWaiterQrDataUrl(payload);
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
  });
});
