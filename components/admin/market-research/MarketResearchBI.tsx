"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Store,
  Layers,
  Utensils,
  ShoppingBag,
  RotateCcw,
  Zap,
  HelpCircle,
  Eye,
  AlertTriangle,
  Lightbulb,
  Building2,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCOP } from "@/lib/subscription-utils";
import type {
  PlatformMarketReport,
  TenantMarketBenchmark,
} from "@/lib/repositories/market-research.repository";
import styles from "./MarketResearchBI.module.css";

interface Props {
  report: PlatformMarketReport;
  onOpenDetail?: (tenantId: string) => void;
}

export function MarketResearchBI({ report, onOpenDetail }: Props) {
  // Internal Sub-View Switcher
  const [activeView, setActiveView] = useState<
    "overview" | "comparative" | "segmentation" | "channels" | "associative"
  >("overview");

  // Selection state for Associative mode
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());

  // Search & Filters for comparative table
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"SALES" | "ORDERS" | "TICKET" | "COMPLETION" | "NAME">(
    "SALES"
  );

  // Active tenants with orders count
  const activeTenantsWithOrders = useMemo(
    () => report.tenants.filter((t) => t.totalOrders > 0),
    [report.tenants]
  );

  // Executive summary rules (derived transparently from real data)
  const executiveObservations = useMemo(() => {
    const observations: string[] = [];
    const totalTenants = report.summary.totalTenants;
    const totalSales = report.summary.totalSalesCop;
    const totalOrders = report.summary.totalOrders;

    if (totalTenants === 0) return ["No hay restaurantes registrados en el ecosistema."];

    // Observation 1: Sales concentration
    const sortedBySales = [...report.tenants].sort((a, b) => b.totalSalesCop - a.totalSalesCop);
    const top2Sales = (sortedBySales[0]?.totalSalesCop || 0) + (sortedBySales[1]?.totalSalesCop || 0);
    const concentrationPct = totalSales > 0 ? Math.round((top2Sales / totalSales) * 100) : 0;
    if (concentrationPct >= 50 && totalTenants >= 3) {
      observations.push(
        `Alta concentración de facturación: el ${concentrationPct}% del GMV total proviene de los dos principales restaurantes (${sortedBySales[0]?.name} y ${sortedBySales[1]?.name}).`
      );
    } else {
      observations.push(
        `Distribución de ventas balanceada entre los restaurantes que registran actividad en el periodo.`
      );
    }

    // Observation 2: Inactive restaurants
    const inactiveCount = report.tenants.filter((t) => t.totalOrders === 0).length;
    if (inactiveCount > 0) {
      observations.push(
        `Oportunidad de activación: ${inactiveCount} de ${totalTenants} restaurantes (${Math.round(
          (inactiveCount / totalTenants) * 100
        )}%) aún no registran comandas en el sistema.`
      );
    }

    // Observation 3: Cancellations and completion
    let totalDelivered = 0;
    let totalCancelled = 0;
    report.tenants.forEach((t) => {
      totalDelivered += t.completedOrders;
      totalCancelled += t.cancelledOrders;
    });

    if (totalOrders > 0) {
      const cancellationPct = Math.round((totalCancelled / totalOrders) * 100);
      if (cancellationPct > 15) {
        observations.push(
          `Atención en cancelaciones: se registra una tasa global de cancelación del ${cancellationPct}% (${totalCancelled} pedidos cancelados).`
        );
      } else {
        observations.push(
          `Tasa de cumplimiento saludable: el ${Math.round(
            (totalDelivered / totalOrders) * 100
          )}% de los pedidos se entregaron satisfactoriamente.`
        );
      }
    }

    return observations;
  }, [report]);

  // Alertas y Oportunidades
  const insights = useMemo(() => {
    const alerts: Array<{ text: string; tenantId: string; tenantName: string }> = [];
    const opportunities: Array<{ text: string; tenantId: string; tenantName: string }> = [];

    report.tenants.forEach((t) => {
      // Alert: High cancellation rate
      if (t.totalOrders >= 4 && t.cancelledOrders >= 2 && t.completionRatePct < 70) {
        alerts.push({
          tenantId: t.tenantId,
          tenantName: t.name,
          text: `${t.name}: Tasa de cancelación del ${100 - t.completionRatePct}% (${t.cancelledOrders} cancelaciones de ${t.totalOrders} pedidos).`,
        });
      }

      // Alert: Paid plan with zero activity
      if (t.planKey !== "STARTER" && t.totalOrders === 0) {
        alerts.push({
          tenantId: t.tenantId,
          tenantName: t.name,
          text: `${t.name}: Suscripción paga (${t.planLabel}) sin pedidos registrados. Requiere onboarding o seguimiento.`,
        });
      }

      // Opportunity: High volume on Starter plan
      if (t.planKey === "STARTER" && t.totalSalesCop >= 80000) {
        opportunities.push({
          tenantId: t.tenantId,
          tenantName: t.name,
          text: `${t.name}: Facturó ${formatCurrencyCOP(t.totalSalesCop)} en Plan Starter gratuito. Candidato ideal para upgrade a Carta Digital o Restro IA.`,
        });
      }

      // Opportunity: High delivery demand
      if (t.channelBreakdown.delivery >= 5 && t.channelBreakdown.deliveryPct >= 40) {
        opportunities.push({
          tenantId: t.tenantId,
          tenantName: t.name,
          text: `${t.name}: Fuerte tracción en canal delivery (${t.channelBreakdown.deliveryPct}% de sus pedidos). Recomendar automatización WhatsApp.`,
        });
      }
    });

    return { alerts, opportunities };
  }, [report.tenants]);

  // Segmentación por Plan
  const planSegmentation = useMemo(() => {
    const map = new Map<string, { count: number; gmv: number; orders: number }>();
    report.tenants.forEach((t) => {
      const existing = map.get(t.planLabel) || { count: 0, gmv: 0, orders: 0 };
      existing.count += 1;
      existing.gmv += t.totalSalesCop;
      existing.orders += t.totalOrders;
      map.set(t.planLabel, existing);
    });
    return Array.from(map.entries()).map(([plan, data]) => ({
      plan,
      ...data,
      avgTicket: data.orders > 0 ? Math.round(data.gmv / data.orders) : 0,
    }));
  }, [report.tenants]);

  // Filtered & Sorted Tenants list for comparative table
  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return report.tenants
      .filter((t) => {
        if (q) {
          const matchName = t.name.toLowerCase().includes(q);
          const matchSlug = t.slug.toLowerCase().includes(q);
          const matchCity = t.city?.toLowerCase().includes(q);
          if (!matchName && !matchSlug && !matchCity) return false;
        }

        if (tierFilter !== "ALL") {
          if (tierFilter === "INSUFFICIENT" && t.totalOrders > 0 && t.totalOrders < 3) return true;
          if (t.performanceTier !== tierFilter) return false;
        }

        if (planFilter !== "ALL" && t.planKey !== planFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NAME") return a.name.localeCompare(b.name);
        if (sortBy === "ORDERS") return b.totalOrders - a.totalOrders;
        if (sortBy === "TICKET") return b.averageTicketCop - a.averageTicketCop;
        if (sortBy === "COMPLETION") return b.completionRatePct - a.completionRatePct;
        return b.totalSalesCop - a.totalSalesCop;
      });
  }, [report.tenants, searchQuery, tierFilter, planFilter, sortBy]);

  // Associative aggregated metrics computation
  const isAnySelected = selectedTenantIds.size > 0;
  const targetTenantsForAssociative = useMemo(() => {
    if (isAnySelected) {
      return report.tenants.filter((t) => selectedTenantIds.has(t.tenantId));
    }
    return filteredTenants;
  }, [report.tenants, selectedTenantIds, isAnySelected, filteredTenants]);

  const associativeHUD = useMemo(() => {
    let salesSum = 0;
    let ordersSum = 0;
    let completedSum = 0;
    let cancelledSum = 0;
    let tablesSum = 0;
    let menuItemsSum = 0;
    let dineInSum = 0;
    let takeoutSum = 0;
    let deliverySum = 0;

    targetTenantsForAssociative.forEach((t) => {
      salesSum += t.totalSalesCop;
      ordersSum += t.totalOrders;
      completedSum += t.completedOrders;
      cancelledSum += t.cancelledOrders;
      tablesSum += t.totalTables;
      menuItemsSum += t.totalMenuItems;
      dineInSum += t.channelBreakdown.dineIn;
      takeoutSum += t.channelBreakdown.takeout;
      deliverySum += t.channelBreakdown.delivery;
    });

    const avgTicket = ordersSum > 0 ? Math.round(salesSum / ordersSum) : 0;
    const completionRate = ordersSum > 0 ? Math.round((completedSum / ordersSum) * 100) : 0;
    const dineInPct = ordersSum > 0 ? Math.round((dineInSum / ordersSum) * 100) : 0;
    const takeoutPct = ordersSum > 0 ? Math.round((takeoutSum / ordersSum) * 100) : 0;
    const deliveryPct = ordersSum > 0 ? Math.round((deliverySum / ordersSum) * 100) : 0;

    return {
      count: targetTenantsForAssociative.length,
      salesSum,
      ordersSum,
      completedSum,
      cancelledSum,
      avgTicket,
      completionRate,
      tablesSum,
      menuItemsSum,
      dineInSum,
      takeoutSum,
      deliverySum,
      dineInPct,
      takeoutPct,
      deliveryPct,
    };
  }, [targetTenantsForAssociative]);

  // CSV Export
  const handleExportCSV = () => {
    const listToExport = isAnySelected
      ? report.tenants.filter((t) => selectedTenantIds.has(t.tenantId))
      : filteredTenants;

    const headers = [
      "ID",
      "Restaurante",
      "Slug",
      "Ciudad",
      "Plan",
      "Clasificacion",
      "Ventas COP",
      "Total Pedidos",
      "Pedidos Entregados",
      "Pedidos Cancelados",
      "Tasa Cumplimiento %",
      "Ticket Promedio COP",
      "Mesas",
      "Platos en Menu",
    ];

    const rows = listToExport.map((t) => [
      t.tenantId,
      `"${t.name.replace(/"/g, '""')}"`,
      t.slug,
      `"${t.city || ""}"`,
      t.planLabel,
      t.performanceTier,
      t.totalSalesCop,
      t.totalOrders,
      t.completedOrders,
      t.cancelledOrders,
      t.completionRatePct,
      t.averageTicketCop,
      t.totalTables,
      t.totalMenuItems,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reporte_analitica_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTierBadge = (t: TenantMarketBenchmark) => {
    // If fewer than 3 orders, mark transparently as Insufficient Data to avoid misleading claims
    if (t.totalOrders > 0 && t.totalOrders < 3) {
      return (
        <span
          className={`${styles.tierBadge} ${styles["tierBadge--INSUFFICIENT"]}`}
          title="Muestra menor a 3 pedidos. Clasificación en espera de volumen estadístico."
        >
          <HelpCircle size={10} /> Muestra Pequeña
        </span>
      );
    }

    switch (t.performanceTier) {
      case "HIGH":
        return (
          <span
            className={`${styles.tierBadge} ${styles["tierBadge--HIGH"]}`}
            title="Criterio: GMV ≥ $200.000 COP o ≥ 10 comandas."
          >
            <TrendingUp size={11} /> Alto Rendimiento
          </span>
        );
      case "MEDIUM":
        return (
          <span
            className={`${styles.tierBadge} ${styles["tierBadge--MEDIUM"]}`}
            title="Criterio: GMV ≥ $50.000 COP o ≥ 3 comandas."
          >
            <CheckCircle2 size={11} /> Rendimiento Medio
          </span>
        );
      case "GROWTH":
        return (
          <span
            className={`${styles.tierBadge} ${styles["tierBadge--GROWTH"]}`}
            title="Criterio: Registra ventas iniciales menores a $50.000 COP."
          >
            <Sparkles size={11} /> En Crecimiento
          </span>
        );
      case "INACTIVE":
        return (
          <span
            className={`${styles.tierBadge} ${styles["tierBadge--INACTIVE"]}`}
            title="Sin pedidos registrados aún."
          >
            <Clock size={11} /> Sin Actividad
          </span>
        );
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleIcon}>
            <BarChart2 size={22} />
          </div>
          <div>
            <h2 className={styles.title}>Inteligencia de Negocio & Benchmarking (BI)</h2>
            <p className={styles.subtitle}>
              Analiza actividad comercial, rendimiento y oportunidades del ecosistema de restaurantes.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.exportBtn} onClick={handleExportCSV}>
            <Download size={14} />
            <span>Exportar CSV ({filteredTenants.length})</span>
          </button>
        </div>
      </div>

      {/* Internal View Navigation Tabs */}
      <div className={styles.viewNav}>
        {[
          { id: "overview", label: "1. Resumen General", icon: <PieChart size={14} /> },
          { id: "comparative", label: "2. Matriz Comparativa", icon: <Store size={14} /> },
          { id: "segmentation", label: "3. Segmentación por Plan", icon: <Layers size={14} /> },
          { id: "channels", label: "4. Canales & Capacidad", icon: <Utensils size={14} /> },
          { id: "associative", label: "5. Exploración Asociativa (Cohortes)", icon: <Zap size={14} /> },
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            className={`${styles.viewNavBtn} ${activeView === v.id ? styles["viewNavBtn--active"] : ""}`}
            onClick={() => setActiveView(v.id as typeof activeView)}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* SUB-VIEW 1: RESUMEN GENERAL */}
      {activeView === "overview" && (
        <>
          {/* Priority KPI Row (max 5 clean indicators) */}
          <div className={styles.kpiRow}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>
                Ventas Totales (GMV)
                <ShoppingBag size={14} />
              </span>
              <span className={styles.kpiValue} style={{ color: "#2563EB" }}>
                {formatCurrencyCOP(report.summary.totalSalesCop)}
              </span>
              <span className={styles.kpiSub}>Comandas entregadas / en preparación</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>
                Volumen de Comandas
                <Layers size={14} />
              </span>
              <span className={styles.kpiValue}>{report.summary.totalOrders}</span>
              <span className={styles.kpiSub}>
                {report.summary.globalAverageOrdersPerTenant} promedio / restaurante
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>
                Ticket Promedio
                <TrendingUp size={14} />
              </span>
              <span className={styles.kpiValue}>
                {formatCurrencyCOP(report.summary.globalAverageTicketCop)}
              </span>
              <span className={styles.kpiSub}>Por comanda no cancelada</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>
                Restaurantes con Ventas
                <Store size={14} />
              </span>
              <span className={styles.kpiValue}>
                {activeTenantsWithOrders.length} de {report.summary.totalTenants}
              </span>
              <span className={styles.kpiSub}>
                {report.summary.totalTenants > 0
                  ? `${Math.round((activeTenantsWithOrders.length / report.summary.totalTenants) * 100)}% con actividad comercial`
                  : "0%"}
              </span>
            </div>
          </div>

          {/* Executive Observations Card */}
          <div className={styles.executiveSummaryCard}>
            <div className={styles.summaryHeader}>
              <Lightbulb size={16} style={{ color: "#2563EB" }} />
              <span>Resumen Ejecutivo & Observaciones del Ecosistema</span>
            </div>
            <div className={styles.observationsList}>
              {executiveObservations.map((obs, idx) => (
                <div key={idx} className={styles.observationItem}>
                  <span className={styles.observationDot} />
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas & Oportunidades Grid */}
          <div className={styles.insightsGrid}>
            {/* Attention Box */}
            <div className={`${styles.insightBox} ${styles["insightBox--attention"]}`}>
              <div className={styles.insightHeader} style={{ color: "#B45309" }}>
                <AlertTriangle size={15} />
                <span>Requieren Atención Operativa ({insights.alerts.length})</span>
              </div>
              {insights.alerts.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
                  No se detectan alertas críticas en las métricas operativas.
                </p>
              ) : (
                <div className={styles.insightList}>
                  {insights.alerts.map((a, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{a.text}</span>
                      {onOpenDetail && (
                        <Button size="sm" variant="ghost" onClick={() => onOpenDetail(a.tenantId)}>
                          Revisar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opportunities Box */}
            <div className={`${styles.insightBox} ${styles["insightBox--opportunity"]}`}>
              <div className={styles.insightHeader} style={{ color: "#15803D" }}>
                <Sparkles size={15} />
                <span>Oportunidades Comerciales ({insights.opportunities.length})</span>
              </div>
              {insights.opportunities.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
                  No hay candidatos destacados pendientes de seguimiento comercial.
                </p>
              ) : (
                <div className={styles.insightList}>
                  {insights.opportunities.map((o, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{o.text}</span>
                      {onOpenDetail && (
                        <Button size="sm" variant="ghost" onClick={() => onOpenDetail(o.tenantId)}>
                          Contactar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SUB-VIEW 2: MATRIZ COMPARATIVA */}
      {activeView === "comparative" && (
        <>
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por restaurante, slug o ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filterControls}>
              <select
                className={styles.selectInput}
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="ALL">Todos los Planes</option>
                <option value="STARTER">Starter</option>
                <option value="CARTA_DIGITAL">Carta Digital</option>
                <option value="RESTRO_IA">Restro IA</option>
                <option value="BUSINESS">Business</option>
              </select>

              <select
                className={styles.selectInput}
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="ALL">Todos los Tiers</option>
                <option value="HIGH">Alto Rendimiento</option>
                <option value="MEDIUM">Rendimiento Medio</option>
                <option value="GROWTH">En Crecimiento</option>
                <option value="INSUFFICIENT">Muestra Pequeña (&lt; 3 pedidos)</option>
                <option value="INACTIVE">Sin Actividad</option>
              </select>

              <select
                className={styles.selectInput}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="SALES">Mayor Facturación (GMV)</option>
                <option value="ORDERS">Mayor Volumen Comandas</option>
                <option value="TICKET">Mayor Ticket Promedio</option>
                <option value="COMPLETION">Mayor Cumplimiento %</option>
                <option value="NAME">Nombre (A-Z)</option>
              </select>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Restaurante</th>
                    <th>Plan SaaS</th>
                    <th>Clasificación de Rendimiento</th>
                    <th>Ventas (GMV)</th>
                    <th>Comandas</th>
                    <th>Ticket Promedio</th>
                    <th>Cumplimiento</th>
                    <th>Canales (Mesa / Llevar / Deliv)</th>
                    <th>Capacidad</th>
                    {onOpenDetail && <th style={{ textAlign: "right" }}>Ficha</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => (
                    <tr key={t.tenantId}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600, color: "#0F172A" }}>{t.name}</span>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", display: "flex", gap: "6px" }}>
                            <Link href={`/restaurant/${t.slug}`} target="_blank" style={{ color: "#2563EB", textDecoration: "none" }}>
                              /{t.slug}
                            </Link>
                            {t.city && <span>• {t.city}</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.planBadge}>{t.planLabel}</span>
                      </td>

                      <td>{getTierBadge(t)}</td>

                      <td>
                        <div className={styles.numValue}>{formatCurrencyCOP(t.totalSalesCop)}</div>
                        <div className={styles.numSub}>
                          {report.summary.totalSalesCop > 0
                            ? `${Math.round((t.totalSalesCop / report.summary.totalSalesCop) * 100)}% de plataforma`
                            : "—"}
                        </div>
                      </td>

                      <td>
                        <div className={styles.numValue}>{t.totalOrders} pedidos</div>
                        <div className={styles.numSub}>
                          {t.completedOrders} entregados • {t.cancelledOrders} cancelados
                        </div>
                      </td>

                      <td>
                        <div className={styles.numValue}>
                          {t.totalOrders > 0 ? formatCurrencyCOP(t.averageTicketCop) : "—"}
                        </div>
                      </td>

                      <td>
                        <div className={styles.numValue}>
                          {t.totalOrders > 0 ? `${t.completionRatePct}%` : "—"}
                        </div>
                      </td>

                      <td>
                        <div className={styles.channelMiniStack}>
                          <div className={styles.channelMiniBar}>
                            <div style={{ width: `${t.channelBreakdown.dineInPct}%`, backgroundColor: "#2563EB" }} />
                            <div style={{ width: `${t.channelBreakdown.takeoutPct}%`, backgroundColor: "#0D9488" }} />
                            <div style={{ width: `${t.channelBreakdown.deliveryPct}%`, backgroundColor: "#EA580C" }} />
                          </div>
                          <div className={styles.channelMiniLegend}>
                            <span>M:{t.channelBreakdown.dineIn}</span>
                            <span>L:{t.channelBreakdown.takeout}</span>
                            <span>D:{t.channelBreakdown.delivery}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.numValue}>{t.totalTables} mesas</div>
                        <div className={styles.numSub}>{t.totalMenuItems} platos</div>
                      </td>

                      {onOpenDetail && (
                        <td style={{ textAlign: "right" }}>
                          <Button size="sm" variant="ghost" onClick={() => onOpenDetail(t.tenantId)}>
                            Ficha
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-VIEW 3: SEGMENTACIÓN POR PLAN */}
      {activeView === "segmentation" && (
        <div className={styles.segmentationGrid}>
          {planSegmentation.map((seg) => (
            <div key={seg.plan} className={styles.segmentCard}>
              <div className={styles.segmentHeader}>
                <span className={styles.segmentTitle}>{seg.plan}</span>
                <span className={styles.segmentCountBadge}>{seg.count} restaurantes</span>
              </div>
              <div className={styles.segmentBody}>
                <div className={styles.segmentRow}>
                  <span>Facturación Acumulada:</span>
                  <span className={styles.segmentVal}>{formatCurrencyCOP(seg.gmv)}</span>
                </div>
                <div className={styles.segmentRow}>
                  <span>Comandas Procesadas:</span>
                  <span className={styles.segmentVal}>{seg.orders}</span>
                </div>
                <div className={styles.segmentRow}>
                  <span>Ticket Promedio:</span>
                  <span className={styles.segmentVal}>{formatCurrencyCOP(seg.avgTicket)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 4: CANALES Y CAPACIDAD */}
      {activeView === "channels" && (
        <div className={styles.channelDashboardGrid}>
          {/* Consumo en mesa */}
          <div className={styles.channelCard}>
            <div className={styles.channelCardHeader}>
              <span className={styles.channelCardTitle}>
                <Utensils size={16} style={{ color: "#2563EB" }} /> Consumo en Mesa
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563EB" }}>
                {associativeHUD.dineInPct}% de los pedidos
              </span>
            </div>
            <span className={styles.channelValueLarge}>{associativeHUD.dineInSum} comandas</span>
            <div className={styles.channelProgressTrack}>
              <div
                className={styles.channelProgressFill}
                style={{ width: `${associativeHUD.dineInPct}%`, backgroundColor: "#2563EB" }}
              />
            </div>
          </div>

          {/* Para Llevar */}
          <div className={styles.channelCard}>
            <div className={styles.channelCardHeader}>
              <span className={styles.channelCardTitle}>
                <ShoppingBag size={16} style={{ color: "#0D9488" }} /> Para Llevar (Takeout)
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0D9488" }}>
                {associativeHUD.takeoutPct}% de los pedidos
              </span>
            </div>
            <span className={styles.channelValueLarge}>{associativeHUD.takeoutSum} comandas</span>
            <div className={styles.channelProgressTrack}>
              <div
                className={styles.channelProgressFill}
                style={{ width: `${associativeHUD.takeoutPct}%`, backgroundColor: "#0D9488" }}
              />
            </div>
          </div>

          {/* Domicilio */}
          <div className={styles.channelCard}>
            <div className={styles.channelCardHeader}>
              <span className={styles.channelCardTitle}>
                <Store size={16} style={{ color: "#EA580C" }} /> Domicilio / Delivery
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#EA580C" }}>
                {associativeHUD.deliveryPct}% de los pedidos
              </span>
            </div>
            <span className={styles.channelValueLarge}>{associativeHUD.deliverySum} comandas</span>
            <div className={styles.channelProgressTrack}>
              <div
                className={styles.channelProgressFill}
                style={{ width: `${associativeHUD.deliveryPct}%`, backgroundColor: "#EA580C" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: EXPLORACIÓN ASOCIATIVA (QLIKSENSE) */}
      {activeView === "associative" && (
        <div className={styles.associativePanel}>
          <div className={styles.associativeHeader}>
            <div className={styles.associativeTitleGroup}>
              <Zap size={16} />
              <span className={styles.associativeTitle}>Sumatoria Asociativa de Cohortes</span>
              <span className={styles.selectionIndicator}>
                {isAnySelected
                  ? `${associativeHUD.count} seleccionados (${Math.round(
                      (associativeHUD.count / report.summary.totalTenants) * 100
                    )}%)`
                  : `Todo el ecosistema (${associativeHUD.count})`}
              </span>
            </div>

            <div className={styles.associativeQuickActions}>
              {isAnySelected && (
                <button
                  type="button"
                  className={styles.hudActionBtn}
                  onClick={() => setSelectedTenantIds(new Set())}
                >
                  <RotateCcw size={12} style={{ display: "inline", marginRight: "4px" }} />
                  Limpiar Selección
                </button>
              )}
              <button
                type="button"
                className={styles.hudActionBtn}
                onClick={() =>
                  setSelectedTenantIds(new Set(filteredTenants.map((t) => t.tenantId)))
                }
              >
                Seleccionar Visibles ({filteredTenants.length})
              </button>
            </div>
          </div>

          <div className={styles.associativeGrid}>
            <div className={styles.associativeCard}>
              <span className={styles.kpiLabel}>Suma de GMV</span>
              <span className={styles.kpiValue} style={{ color: "#2563EB" }}>
                {formatCurrencyCOP(associativeHUD.salesSum)}
              </span>
            </div>
            <div className={styles.associativeCard}>
              <span className={styles.kpiLabel}>Suma de Pedidos</span>
              <span className={styles.kpiValue}>{associativeHUD.ordersSum}</span>
            </div>
            <div className={styles.associativeCard}>
              <span className={styles.kpiLabel}>Ticket Ponderado</span>
              <span className={styles.kpiValue}>{formatCurrencyCOP(associativeHUD.avgTicket)}</span>
            </div>
            <div className={styles.associativeCard}>
              <span className={styles.kpiLabel}>Cumplimiento</span>
              <span className={styles.kpiValue}>{associativeHUD.completionRate}%</span>
            </div>
            <div className={styles.associativeCard}>
              <span className={styles.kpiLabel}>Mesas Totales</span>
              <span className={styles.kpiValue}>{associativeHUD.tablesSum}</span>
            </div>
          </div>

          <div className={styles.tableContainer} style={{ borderTop: "1px solid #E2E8F0" }}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={
                          filteredTenants.length > 0 &&
                          filteredTenants.every((t) => selectedTenantIds.has(t.tenantId))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenantIds(new Set(filteredTenants.map((t) => t.tenantId)));
                          } else {
                            setSelectedTenantIds(new Set());
                          }
                        }}
                      />
                    </th>
                    <th>Restaurante</th>
                    <th>Plan</th>
                    <th>Ventas (GMV)</th>
                    <th>Pedidos</th>
                    <th>Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => {
                    const isSelected = selectedTenantIds.has(t.tenantId);
                    return (
                      <tr key={t.tenantId} className={isSelected ? styles["row--selected"] : ""}>
                        <td className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedTenantIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(t.tenantId)) next.delete(t.tenantId);
                                else next.add(t.tenantId);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.planLabel}</td>
                        <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrencyCOP(t.totalSalesCop)}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{t.totalOrders}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrencyCOP(t.averageTicketCop)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
