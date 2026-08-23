"use client";

import React, { useState, useEffect, useTransition, useCallback, useRef } from "react";
import type { OrderWithItems, OrderStatus } from "@/lib/types";
import {
  updateOrderStatusAction,
  fetchKdsOrdersAction,
  toggleOrderPriorityAction,
  reportOrderIncidentAction,
  updateOrderItemStatusAction,
} from "@/app/actions/orders";
import { KdsOrderCard } from "./KdsOrderCard";
import { KdsTraceabilityDrawer } from "./KdsTraceabilityDrawer";
import {
  Volume2,
  VolumeX,
  History,
  ChefHat,
  Flame,
  Clock,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import styles from "./KdsDashboard.module.css";

interface KdsDashboardClientProps {
  initialOrders: OrderWithItems[];
  tenantId?: string;
}

export function KdsDashboardClient({
  initialOrders,
  tenantId,
}: KdsDashboardClientProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTraceability, setShowTraceability] = useState(false);
  const [stationFilter, setStationFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [, startTransition] = useTransition();

  // Optimistic Status Lock Ref (prevents flickering/bouncing during server background sync)
  const pendingStatusRef = useRef<Record<string, OrderStatus>>({});

  // Audio Player for /sounds/kds-notification.mp3
  const playChimeNewOrder = useCallback(() => {
    try {
      const audio = new Audio("/sounds/kds-notification.mp3");
      audio.volume = 0.85;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.log("Audio autoplay prevented by browser:", e);
        });
      }
    } catch (e) {
      console.error("Error playing notification sound:", e);
    }
  }, []);

  // Track known order IDs to prevent duplicate alerts/chimes
  const isInitializedRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );

  // Sync orders with server & play chime on new orders (Guaranteed single alert)
  const syncOrders = useCallback(async () => {
    const res = await fetchKdsOrdersAction();
    if (res.success && res.orders) {
      // Detect new orders outside setState to avoid React StrictMode double-execution
      let hasNewOrder = false;

      res.orders.forEach((o) => {
        if (!knownOrderIdsRef.current.has(o.id)) {
          hasNewOrder = true;
          knownOrderIdsRef.current.add(o.id);
        }
      });

      // Trigger sound and toast only once for genuine new orders
      if (hasNewOrder && isInitializedRef.current && soundEnabled) {
        playChimeNewOrder();
        toast.info("¡Nueva comanda recibida!", { icon: "🔔" });
      }

      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }

      // Pure State Update (Merge server orders with optimistic status locks)
      setOrders((prev) => {
        return res.orders.map((serverOrder) => {
          const lockedStatus = pendingStatusRef.current[serverOrder.id];
          if (lockedStatus) {
            return { ...serverOrder, status: lockedStatus };
          }
          return serverOrder;
        });
      });
    }
  }, [soundEnabled, playChimeNewOrder]);

  // Live timer ticker every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Environment-aware Polling: 45s in Production, 10s in Development/Local
  const pollingIntervalMs = process.env.NODE_ENV === "production" ? 45000 : 10000;

  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncOrders();
    }, pollingIntervalMs);
    return () => clearInterval(syncInterval);
  }, [syncOrders, pollingIntervalMs]);

  // Fullscreen Modo Cocina Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Status Change with 100% Stable Optimistic UI Support (No Bouncing)
  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const previousStatus = targetOrder.status;

    // 1. Set Optimistic Lock in Ref so background sync NEVER reverts it
    pendingStatusRef.current[orderId] = nextStatus;

    // 2. Instant Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, nextStatus);

      // Clean up lock after server action completes
      delete pendingStatusRef.current[orderId];

      if (!res.success) {
        toast.error(res.message);
        // Rollback on server error
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o))
        );
      } else {
        // Show Undo Toast
        toast.success(`Comanda #${targetOrder.orderNumber} ➔ ${nextStatus}`, {
          action: {
            label: "DESHACER",
            onClick: () => {
              handleUpdateStatus(orderId, previousStatus);
            },
          },
        });
      }
    });
  };

  // Priority Toggle Handler
  const handleTogglePriority = (orderId: string, currentPriority: boolean) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, isPriority: !currentPriority } : o))
    );
    startTransition(async () => {
      await toggleOrderPriorityAction(orderId, !currentPriority);
    });
  };

  // Incident Report Handler
  const handleReportIncident = (orderId: string) => {
    const note = prompt("Escribe la incidencia (ej. Falta de ingrediente, error en pedido):");
    if (!note?.trim()) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, incidentNote: note.trim() } : o))
    );

    startTransition(async () => {
      await reportOrderIncidentAction(orderId, note.trim());
      toast.warning("Incidencia registrada en auditoría");
    });
  };

  // Item Status Handler
  const handleUpdateItemStatus = (itemId: string, nextItemStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        items: o.items.map((i) => (i.id === itemId ? { ...i, status: nextItemStatus } : i)),
      }))
    );

    startTransition(async () => {
      await updateOrderItemStatusAction(itemId, nextItemStatus);
    });
  };

  // Reopen Order Handler
  const handleReopenOrder = (orderId: string) => {
    handleUpdateStatus(orderId, "PENDING");
    setShowTraceability(false);
  };

  // Cancel Order Handler
  const handleCancelOrder = (orderId: string) => {
    const reason = prompt("Escribe la razón de cancelación (ej. Cliente canceló, falta de insumo):");
    if (reason === null) return;

    const previousStatus = orders.find((o) => o.id === orderId)?.status;

    // Optimistic UI Update
    pendingStatusRef.current[orderId] = "CANCELLED";
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
    );

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, "CANCELLED");
      delete pendingStatusRef.current[orderId];

      if (!res.success) {
        toast.error("No se pudo cancelar la orden");
        if (previousStatus) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o))
          );
        }
      } else {
        if (reason.trim()) {
          await reportOrderIncidentAction(orderId, `CANCELADA: ${reason.trim()}`);
        }
        toast.warning("Comanda cancelada y registrada en auditoría");
      }
    });
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toString().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchNum && !matchName && !matchItems) return false;
    }

    // Station Filter
    if (stationFilter !== "ALL") {
      const matchStation = o.items.some((i) => i.station === stationFilter || !i.station);
      if (!matchStation) return false;
    }

    return true;
  });

  // Sort: Priority orders float to top
  const sortOrders = (list: OrderWithItems[]) => {
    return [...list].sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const pendingOrders = sortOrders(filteredOrders.filter((o) => o.status === "PENDING"));
  const preparingOrders = sortOrders(filteredOrders.filter((o) => o.status === "PREPARING"));
  const readyOrders = sortOrders(filteredOrders.filter((o) => o.status === "READY"));

  // Calculate Metrics & SLA %
  const activeOrdersCount = pendingOrders.length + preparingOrders.length + readyOrders.length;

  let onTimeCount = 0;
  let totalActiveSec = 0;

  [...pendingOrders, ...preparingOrders, ...readyOrders].forEach((o) => {
    const elapsedSec = Math.max(0, (now.getTime() - new Date(o.createdAt).getTime()) / 1000);
    totalActiveSec += elapsedSec;
    const targetSec = (o.targetPrepTimeMinutes || 12) * 60;
    if (elapsedSec < targetSec) onTimeCount++;
  });

  const slaPercent = activeOrdersCount > 0 ? Math.round((onTimeCount / activeOrdersCount) * 100) : 100;
  const avgPrepSec = activeOrdersCount > 0 ? Math.floor(totalActiveSec / activeOrdersCount) : 0;
  const avgMinutes = Math.floor(avgPrepSec / 60);
  const avgSeconds = avgPrepSec % 60;
  const avgFormatted = `${avgMinutes}:${avgSeconds < 10 ? "0" : ""}${avgSeconds}`;

  const localTimeFormatted = now.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Adamind AI Alert logic
  const isBottleneck = preparingOrders.length >= 4 || avgMinutes >= 10;

  return (
    <div
      className={`${styles.kdsContainer} ${
        isFullscreen ? styles.fullscreenMode : ""
      }`}
    >
      {/* ── Top Header ────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <div className={styles.kdsTitle}>
            <ChefHat size={24} color="#38BDF8" />
            Gestión de Comandas
          </div>
        </div>

        {/* Adamind AI Bottleneck Banner */}
        {isBottleneck && (
          <div className={styles.aiBanner}>
            <span className={styles.aiBadge}>ADAMIND IA</span>
            <span>
              <Sparkles size={14} style={{ marginRight: 4 }} />
              Detección de flujo: {preparingOrders.length} comandas en preparación activa (+{avgMinutes}m promedio).
            </span>
          </div>
        )}

        {/* Metrics */}
        <div className={styles.metricsGroup}>
          <div className={styles.metricBadge}>
            <span className={styles.metricLabel}>ABIERTAS</span>
            <span className={styles.metricValue}>{activeOrdersCount}</span>
          </div>

          <div className={styles.metricBadge}>
            <span className={styles.metricLabel}>TIEMPO PROM.</span>
            <span className={`${styles.metricValue} ${styles.metricValueGreen}`}>
              {avgFormatted}
            </span>
          </div>

          <div className={styles.metricBadge}>
            <span className={styles.metricLabel}>SLA %</span>
            <span
              className={styles.metricValue}
              style={{ color: slaPercent >= 85 ? "#4ADE80" : "#F59E0B" }}
            >
              {slaPercent}%
            </span>
          </div>

          <div className={styles.metricBadge}>
            <span className={styles.metricLabel}>HORA</span>
            <span className={styles.metricValue} style={{ color: "#F8FAFC" }}>
              {localTimeFormatted}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.actionsGroup}>
          {/* Station Filter */}
          <select
            className={styles.stationSelect}
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
          >
            <option value="ALL">Todas las Estaciones</option>
            <option value="Cocina">Cocina Principal</option>
            <option value="Parrilla">Parrilla</option>
            <option value="Fritura">Fritura</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Postres">Postres</option>
            <option value="Despacho">Despacho</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Buscar # o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          {/* Test Sound Button */}
          <button
            className={styles.btnActionTop}
            onClick={() => {
              playChimeNewOrder();
              toast.success("Sonido de comanda reproducido");
            }}
            title="Probar sonido de notificación"
          >
            <BellRing size={16} color="#38BDF8" /> Probar Sonido
          </button>

          {/* Sound Toggle */}
          <button
            className={styles.btnActionTop}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 size={16} color="#38BDF8" /> : <VolumeX size={16} color="#94A3B8" />}
          </button>

          {/* Modo Cocina (Fullscreen) */}
          <button
            className={`${styles.btnActionTop} ${styles.btnKitchenMode}`}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? "Salir Cocina" : "Modo Cocina"}
          </button>

          {/* History Drawer Toggle */}
          <button
            className={styles.btnActionTop}
            onClick={() => setShowTraceability(!showTraceability)}
          >
            <History size={16} />
            Trazabilidad
          </button>
        </div>
      </header>

      {/* ── Main 3 Columns Workspace (Full Width) ─────────── */}
      <div className={styles.mainWorkspace}>
        <div className={styles.columnsGrid}>
          {/* Column 1: NUEVAS */}
          <div className={styles.kdsColumn}>
            <div className={`${styles.columnHeader} ${styles.colHeaderPending}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Flame size={18} />
                NUEVAS ({pendingOrders.length})
              </div>
              <span className={styles.columnCountBadge}>{pendingOrders.length}</span>
            </div>

            <div className={styles.cardsScrollArea}>
              {pendingOrders.length === 0 ? (
                <div className={styles.emptyColumnState}>
                  <ChefHat size={36} />
                  Sin nuevas comandas en espera
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <KdsOrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onTogglePriority={handleTogglePriority}
                    onReportIncident={handleReportIncident}
                    onUpdateItemStatus={handleUpdateItemStatus}
                    onCancelOrder={handleCancelOrder}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: EN PREPARACIÓN */}
          <div className={styles.kdsColumn}>
            <div className={`${styles.columnHeader} ${styles.colHeaderPreparing}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={18} />
                EN PREPARACIÓN ({preparingOrders.length})
              </div>
              <span className={styles.columnCountBadge}>{preparingOrders.length}</span>
            </div>

            <div className={styles.cardsScrollArea}>
              {preparingOrders.length === 0 ? (
                <div className={styles.emptyColumnState}>
                  <Clock size={36} />
                  No hay comandas en cocción activa
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <KdsOrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onTogglePriority={handleTogglePriority}
                    onReportIncident={handleReportIncident}
                    onUpdateItemStatus={handleUpdateItemStatus}
                    onCancelOrder={handleCancelOrder}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: LISTAS PARA SERVIR */}
          <div className={styles.kdsColumn}>
            <div className={`${styles.columnHeader} ${styles.colHeaderReady}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={18} />
                LISTAS PARA SERVIR ({readyOrders.length})
              </div>
              <span className={styles.columnCountBadge}>{readyOrders.length}</span>
            </div>

            <div className={styles.cardsScrollArea}>
              {readyOrders.length === 0 ? (
                <div className={styles.emptyColumnState}>
                  <CheckCircle2 size={36} />
                  Sin comandes pendientes de entregar
                </div>
              ) : (
                readyOrders.map((order) => (
                  <KdsOrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onTogglePriority={handleTogglePriority}
                    onReportIncident={handleReportIncident}
                    onUpdateItemStatus={handleUpdateItemStatus}
                    onCancelOrder={handleCancelOrder}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* History & Traceability Drawer (Sliding Panel) */}
        {showTraceability && (
          <KdsTraceabilityDrawer
            orders={orders}
            onClose={() => setShowTraceability(false)}
            onReopenOrder={handleReopenOrder}
          />
        )}
      </div>
    </div>
  );
}
