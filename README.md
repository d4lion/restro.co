# Restro 🍽️

Restro es un SaaS (Software as a Service) moderno diseñado para la gestión de restaurantes, combinando la solidez de una plataforma **Enterprise SaaS** con la calidez del sector **Hospitality**. Creado por Adamind Tech.

## 🚀 Hoja de Ruta de Módulos (Roadmap)

A continuación se detallan las características del negocio, estructuradas por módulos para tener visibilidad de qué está completo a nivel de modelo de datos (`Core/DB`) y qué interfaces o lógica faltan por desarrollar.

### 1. Autenticación & Multi-tenant (SaaS Core)
La base fundamental para operar múltiples restaurantes de forma aislada.
- [x] Arquitectura Multi-tenant (cada restaurante es un `Tenant`).
- [x] Modelo de Usuarios (Dueños, Gerentes, Meseros, Cocina).
- [x] Autenticación de usuarios vía Supabase Auth.
- [x] Flujo de Onboarding (creación del restaurante tras registrarse).
- [ ] Gestión de invitaciones de Staff (enviar links para unirse al restaurante).
- [x] Personalización del Restaurante (Slug único, colores de marca, logo).

### 2. Planes y Suscripciones (Billing)
El motor de monetización del SaaS. Controla a qué tiene acceso cada restaurante.
- [x] Modelado de **Planes** (Starter, Restro IA, Business).
- [x] **Límites de Uso por Plan:** Máximo de mesas (`maxTables`), máximo de ítems en el menú (`maxMenuItems`), máximo de personal (`maxStaff`), y retención de analíticas (`analyticsDays`).
- [x] **Feature Flags de Planes:** 
  - `hasAI` (Restro IA).
  - `hasInventory` (Gestión de inventarios).
  - `hasMultiLanguage` (Menús en varios idiomas).
  - `hasExportPDF` / `hasExportExcel` (Reportes avanzados).
  - `hasCustomBranding` (Colores y marca sin watermark).
  - `hasWhatsApp` (Lista de espera y notificaciones).
  - `hasPrioritySupport`.
- [x] **Tenant Feature Overrides:** Posibilidad de darle a un restaurante específico acceso a funciones premium sin cambiar de plan (ej. Promociones manuales).
- [ ] Panel de Suscripción en el Dashboard (ver plan actual, actualizar plan).
- [ ] Gestión de Periodos de Prueba (Trials) y expiraciones.
- [ ] Integración de pagos con **Wompi** (Customer ID, Suscripciones, Webhooks para eventos `PAYMENT_SUCCESS`, etc.).

### 3. Gestión de Menús (Catálogo)
Módulo administrativo donde el restaurante define su oferta.
- [x] Esquema de Datos: Menús (Cartas), Categorías, Productos (Items) con precios.
- [x] Pantallas base en el Dashboard (rutas bajo `/menu`).
- [x] CRUD completo funcional para administrar el Menú (Categorías y Platos).
- [ ] Capacidad de ordenar Categorías y Productos (drag and drop / sortOrder).
- [ ] Subida de imágenes para categorías e ítems (Integrado con Supabase Storage).
- [ ] *(Futuro)* Configuración de tags e información nutricional (ej: Vegano, Gluten-Free).

### 4. Gestión de Mesas y Códigos QR
Conecta el mundo físico del restaurante con la plataforma.
- [x] Esquema de Datos para Mesas con capacidad y nombre ("Barra", "Terraza 1").
- [x] Generación de un `qrToken` único e inmutable por mesa.
- [x] Pantalla de administración de mesas en el Dashboard (CRUD).
- [ ] Generador visual de PDF de Códigos QR para impresión masiva (usando `qrcode`, `jspdf`, `html2canvas`).

### 5. Frontend de Comensales (Customer-Facing Menu)
Lo que ve el cliente final cuando escanea el código QR de una mesa.
- [ ] Vista web pública optimizada para móviles (accedida vía el slug del restaurante y token de mesa).
- [ ] Visualización del menú con branding del restaurante.
- [ ] Carrito de compras para auto-pedido desde la mesa (Dine-in).
- [ ] Soporte para pedidos Para Llevar (Takeout) y Domicilios (Delivery).

### 6. Punto de Venta y Gestión de Comandas (Orders / POS)
El corazón operativo del restaurante.
- [x] Arquitectura de Órdenes (`DINE_IN`, `TAKEOUT`, `DELIVERY`).
- [x] Historial de transiciones de estados (`PENDING` -> `PREPARING` -> `READY` -> `DELIVERED`).
- [ ] **POS (Point of Sale):** Interfaz ágil para que los meseros/cajeros tomen pedidos manualmente.
- [ ] **KDS (Kitchen Display System):** Pantalla en tiempo real para que la cocina vea qué platos deben preparar y actualicen su estado.
- [ ] Impresión de tickets de comandas / recibos.

### 7. Analíticas y Reportes
Visibilidad sobre las ventas y la interacción de los clientes.
- [x] Estructura de ingesta de eventos (`AnalyticsEvent`) ligada a sesiones.
- [ ] Dashboard de Visión General (Overview) con métricas de ventas, platos más vendidos, etc.
- [ ] Exportación de reportes de cierre de caja.
- [ ] *(Futuro)* Analíticas avanzadas impulsadas por "Restro IA".

### 8. Integraciones y Funciones Avanzadas
- [ ] **WhatsApp:** Lista de espera (Waitlist) vía correo electrónico/WhatsApp.
- [ ] *(Futuro)* **Inventario:** Descuento automático de ingredientes y alertas de stock bajo.
- [ ] *(Futuro)* Integración de WhatsApp para recepción automática de domicilios.

---

## 🛠️ Stack Tecnológico (Core)

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Base de Datos:** PostgreSQL (Prisma ORM) con Better-SQLite3 para entorno local.
- **Autenticación:** Next-Auth v5 (Beta) + Supabase
- **Estilos y UI:** CSS Modules, Custom Design System (`design.md`), Radix UI.

## 🚀 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Sincronizar la base de datos local (SQLite para desarrollo)
npm run db:push

# 3. Insertar datos de prueba (Planes, Restaurante demo, etc.)
npm run db:seed  

# 4. Iniciar entorno de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
