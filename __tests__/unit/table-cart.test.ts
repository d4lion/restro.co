import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateOrder, mockValidateTable } = vi.hoisted(() => ({
  mockCreateOrder: vi.fn(),
  mockValidateTable: vi.fn(),
}));

vi.mock("@/app/actions/orders", () => ({
  createPublicOrderAction: mockCreateOrder,
  validateTableAction: mockValidateTable,
}));

const baseProps = {
  tenantId: "tenant-1",
  tenantName: "La Parrilla",
  tenantDescription: null,
  logoUrl: null,
  coverUrl: null,
  phone: "3105550001",
  address: "Calle 93",
  city: "Bogotá",
  brandColor: "#2563EB",
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  websiteUrl: null,
  categories: [
    {
      id: "cat-1",
      name: "Carnes",
      description: null,
      items: [
        {
          id: "item-1",
          name: "Churrasco 300g",
          description: "Corte premium",
          price: 68000,
          imageUrl: null,
          isAvailable: true,
          isHighlighted: false,
          modifierGroups: [],
        },
      ],
    },
  ],
};

async function renderMenu(overrides: Record<string, unknown>, url: string) {
  window.history.replaceState({}, "", url);
  const React = await import("react");
  const rtl = await import("@testing-library/react");
  const { PublicMenuClient } = await import("@/components/public/PublicMenuClient");
  rtl.render(React.createElement(PublicMenuClient, { ...baseProps, ...overrides } as never));
  return rtl;
}

async function addChurrascoToCart(rtl: typeof import("@testing-library/react")) {
  rtl.fireEvent.click(rtl.screen.getByText("Churrasco 300g"));
  rtl.fireEvent.click(rtl.screen.getByText("Agregar"));
}

describe("Menu-only plans: table cart (Carta Digital) and WhatsApp ordering", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { cleanup } = await import("@testing-library/react");
    cleanup();
    mockValidateTable.mockResolvedValue({ valid: true, table: { id: "table-4", name: "Mesa 4" } });
  });

  it("Carta Digital + scanned table QR: builds a cart and generates the waiter QR without touching the DB", async () => {
    const rtl = await renderMenu(
      { plan: "CARTA_DIGITAL", isMenuOnly: false, isPlanMenuOnly: true, tableCartEnabled: true },
      "/restaurant/la-parrilla?tableId=cmvhmxg74000b44lixtv91biw"
    );

    // Cart becomes available once the table param is detected
    expect(await rtl.screen.findByTitle("Agregar al pedido")).toBeInTheDocument();
    await addChurrascoToCart(rtl);

    rtl.fireEvent.click(rtl.screen.getByText(/Ver mi pedido/));
    const generateBtn = await rtl.screen.findByTestId("generate-waiter-qr-btn");
    expect(rtl.screen.queryByText(/Enviar Pedido a WhatsApp/)).not.toBeInTheDocument();
    expect(rtl.screen.queryByText("¿CÓMO DESEAS RECIBIR TU PEDIDO?")).not.toBeInTheDocument();

    rtl.fireEvent.click(generateBtn);
    const panel = await rtl.screen.findByTestId("waiter-qr-panel");
    expect(panel).toHaveTextContent("Mesa 4");
    expect(rtl.screen.getByAltText("Código QR de tu pedido para el mesero").getAttribute("src")).toMatch(
      /^data:image\/png;base64,/
    );

    expect(mockValidateTable).toHaveBeenCalledWith("tenant-1", "cmvhmxg74000b44lixtv91biw");
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("Solo Carta Visual (isMenuOnly: true) stays read-only even with a table QR", async () => {
    const rtl = await renderMenu(
      { plan: "CARTA_DIGITAL", isMenuOnly: true, isPlanMenuOnly: true, tableCartEnabled: true },
      "/restaurant/la-parrilla?tableId=cmvhmxg74000b44lixtv91biw"
    );

    expect(await rtl.screen.findByText("Ver detalle")).toBeInTheDocument();
    expect(rtl.screen.queryByTitle("Agregar al pedido")).not.toBeInTheDocument();
    expect(rtl.screen.queryByText(/Ver mi pedido/)).not.toBeInTheDocument();
  });

  it("Carta Digital without a table QR and without WhatsApp stays a read-only menu", async () => {
    const rtl = await renderMenu(
      { plan: "CARTA_DIGITAL", isMenuOnly: false, isPlanMenuOnly: true, tableCartEnabled: true },
      "/restaurant/la-parrilla"
    );

    expect(await rtl.screen.findByText("Ver detalle")).toBeInTheDocument();
    expect(rtl.screen.queryByTitle("Agregar al pedido")).not.toBeInTheDocument();
    expect(rtl.screen.queryByText(/Ver mi pedido/)).not.toBeInTheDocument();
  });

  it("Carta Digital with an INVALID table QR cannot generate the waiter QR", async () => {
    mockValidateTable.mockResolvedValue({ valid: false, table: null });
    const rtl = await renderMenu(
      { plan: "CARTA_DIGITAL", isMenuOnly: false, isPlanMenuOnly: true, tableCartEnabled: true },
      "/restaurant/la-parrilla?table=forged-token"
    );

    await rtl.screen.findByTitle("Agregar al pedido");
    await addChurrascoToCart(rtl);
    rtl.fireEvent.click(rtl.screen.getByText(/Ver mi pedido/));

    expect(await rtl.screen.findByText("Mesa no verificada:")).toBeInTheDocument();
    expect(rtl.screen.queryByTestId("generate-waiter-qr-btn")).not.toBeInTheDocument();
  });

  it("WhatsApp ordering enables cart without requiring a table QR (no DB order)", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const rtl = await renderMenu(
      {
        plan: "STARTER",
        isMenuOnly: false,
        isPlanMenuOnly: true,
        tableCartEnabled: false,
        allowWhatsAppOrdering: true,
        allowTakeout: true,
        whatsappNumber: "3105550001",
      },
      "/restaurant/la-parrilla"
    );

    expect(await rtl.screen.findByTitle("Agregar al pedido")).toBeInTheDocument();
    await addChurrascoToCart(rtl);
    rtl.fireEvent.click(rtl.screen.getByText(/Ver mi pedido/));

    expect(rtl.screen.queryByTestId("generate-waiter-qr-btn")).not.toBeInTheDocument();
    // Must NOT block or show invalid table error when ordering from home/outside via WhatsApp
    expect(rtl.screen.queryByText("Mesa no verificada o inválida:")).not.toBeInTheDocument();

    rtl.fireEvent.change(rtl.screen.getByPlaceholderText("Ej. Juan Pérez"), { target: { value: "Ana" } });
    const waBtn = rtl.screen.getByText(/Enviar Pedido a WhatsApp/);
    expect(waBtn.closest("button")).not.toBeDisabled();
    rtl.fireEvent.click(waBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = String(openSpy.mock.calls[0][0]);
    expect(url).toContain("api.whatsapp.com/send?phone=573105550001");
    expect(decodeURIComponent(url)).toContain("1x Churrasco 300g");
    expect(mockCreateOrder).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("Starter with WhatsApp ordering OFF remains a read-only menu", async () => {
    const rtl = await renderMenu(
      { plan: "STARTER", isMenuOnly: false, isPlanMenuOnly: true, allowWhatsAppOrdering: false },
      "/restaurant/la-parrilla?table=tok-mesa-4"
    );

    expect(await rtl.screen.findByText("Ver detalle")).toBeInTheDocument();
    expect(rtl.screen.queryByTitle("Agregar al pedido")).not.toBeInTheDocument();
  });
});
