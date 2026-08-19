# RESTRO — DESIGN SYSTEM

## 0. Contexto

Restro es un SaaS de Adamind Tech orientado a restaurantes.

El producto debe sentirse como un **SaaS empresarial moderno**, pero con una personalidad amigable y relacionada con restaurantes.

Referencias de calidad visual:

- Google / Google Cloud
- DigitalOcean
- Docker
- Atlassian

No copiar sus interfaces.

Tomar únicamente como referencia:

- simplicidad
- consistencia
- claridad
- jerarquía visual
- diseño de componentes
- profesionalismo

### Personalidad

Restro =

**Enterprise SaaS + Hospitality**

Debe sentirse:

- profesional
- confiable
- tecnológico
- limpio
- moderno
- amigable
- sencillo

No debe sentirse:

- infantil
- excesivamente corporativo
- genérico
- recargado
- futurista
- excesivamente colorido

---

# 1. DESIGN TOKENS

Todos los componentes DEBEN utilizar estos tokens.

No crear colores, tamaños o radios arbitrarios.

---

## 1.1 Colores

### Brand

```text
primary-900: #172554
primary-800: #1E3A8A
primary-700: #1D4ED8
primary-600: #2563EB
primary-500: #3B82F6
primary-400: #60A5FA
primary-100: #DBEAFE
primary-50:  #EFF6FF
```

### Accent

```text
accent-700: #0F766E
accent-600: #0D9488
accent-500: #14B8A6
accent-100: #CCFBF1
accent-50:  #F0FDFA
```

El accent teal debe utilizarse con moderación.

Su propósito es aportar personalidad a Restro.

---

## 1.2 Neutrales

```text
neutral-950: #020617
neutral-900: #0F172A
neutral-800: #1E293B
neutral-700: #334155
neutral-600: #475569
neutral-500: #64748B
neutral-400: #94A3B8
neutral-300: #CBD5E1
neutral-200: #E2E8F0
neutral-100: #F1F5F9
neutral-50:  #F8FAFC
white:       #FFFFFF
```

---

## 1.3 Semantic colors

```text
success-700: #15803D
success-600: #16A34A
success-100: #DCFCE7
success-50:  #F0FDF4

warning-700: #B45309
warning-600: #D97706
warning-100: #FEF3C7
warning-50:  #FFFBEB

error-700: #B91C1C
error-600: #DC2626
error-100: #FEE2E2
error-50:  #FEF2F2

info-700: #0369A1
info-600: #0284C7
info-100: #E0F2FE
info-50:  #F0F9FF
```

---

# 2. COLOR USAGE

La interfaz debe ser predominantemente neutra.

Distribución aproximada:

```text
Neutrales: 75%
Primary:   15%
Accent:     5%
Semantic:   5%
```

### Regla

El color debe comunicar jerarquía.

No utilizar colores únicamente para decorar.

### Primary

Utilizar para:

- CTA principal
- links
- elementos activos
- selección
- focus
- acciones importantes

### Accent

Utilizar para:

- métricas positivas
- elementos relacionados con hospitality
- highlights
- determinados estados de disponibilidad
- branding secundario

### Semantic

Utilizar únicamente para comunicar:

- éxito
- advertencia
- error
- información

---

# 3. TIPOGRAFÍA

## Font family

Utilizar:

**Inter**

No utilizar múltiples familias tipográficas.

---

## Type Scale

```text
display:
48px / 56px / 700

h1:
36px / 44px / 700

h2:
30px / 38px / 700

h3:
24px / 32px / 600

h4:
20px / 28px / 600

body-lg:
18px / 28px / 400

body:
16px / 24px / 400

body-sm:
14px / 20px / 400

caption:
12px / 16px / 500
```

### Font weights

```text
400 = Regular
500 = Medium
600 = Semibold
700 = Bold
```

No utilizar 800–900 salvo casos excepcionales de branding.

---

# 4. SPACING SYSTEM

Utilizar exclusivamente una escala basada en 4px.

```text
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-5:  20px
space-6:  24px
space-8:  32px
space-10: 40px
space-12: 48px
space-16: 64px
space-20: 80px
```

### Uso habitual

```text
Icon → text:       8px
Label → input:    6–8px
Input → input:    16px
Card padding:     24px
Section spacing:  32–48px
Page padding:     32px
```

---

# 5. BORDER RADIUS

Restro utiliza radios moderados.

```text
radius-sm:   4px
radius-md:   6px
radius-lg:   8px
radius-xl:  10px
radius-2xl: 12px
radius-full: 9999px
```

### Uso

```text
Input:       6–8px
Button:      6–8px
Card:        10px
Modal:       12px
Badge:       6px
Avatar:      9999px
```

No utilizar grandes radios en todos los componentes.

Evitar interfaces donde absolutamente todo parezca una cápsula.

---

# 6. BORDERS

Color estándar:

```text
#E2E8F0
```

Border secundario:

```text
#F1F5F9
```

Utilizar:

```text
border: 1px solid #E2E8F0
```

No utilizar bordes negros.

No utilizar bordes gruesos.

---

# 7. SHADOWS

Restro debe depender más del contraste y los borders que de las sombras.

### Small

```text
0 1px 2px rgba(15, 23, 42, 0.05)
```

### Medium

```text
0 4px 12px rgba(15, 23, 42, 0.08)
```

### Large

```text
0 12px 32px rgba(15, 23, 42, 0.12)
```

Uso:

```text
Cards:      normalmente sin shadow
Dropdown:   small/medium
Modal:      large
Tooltip:    small
```

No utilizar shadows como elemento decorativo permanente.

---

# 8. BUTTON SYSTEM

## Button heights

```text
sm: 32px
md: 40px
lg: 48px
```

### Button SM

```text
height: 32px
padding-x: 12px
font: 14px
radius: 6px
```

Uso:

- filtros
- tablas
- acciones pequeñas

### Button MD

```text
height: 40px
padding-x: 16px
font: 14px
weight: 500–600
radius: 6px
```

Este es el tamaño estándar de Restro.

### Button LG

```text
height: 48px
padding-x: 20px
font: 16px
weight: 600
radius: 8px
```

Uso:

- onboarding
- CTA principales
- landing page
- acciones críticas

---

# 9. BUTTON VARIANTS

## Primary

```text
background: #2563EB
color: #FFFFFF
```

Hover:

```text
#1D4ED8
```

Active:

```text
#1E40AF
```

Disabled:

```text
background: #BFDBFE
color: #FFFFFF
```

---

## Secondary

```text
background: #FFFFFF
border: #CBD5E1
color: #334155
```

Hover:

```text
background: #F8FAFC
```

---

## Ghost

```text
background: transparent
color: #475569
```

Hover:

```text
background: #F1F5F9
```

---

## Destructive

```text
background: #DC2626
color: #FFFFFF
```

Hover:

```text
#B91C1C
```

Utilizar exclusivamente para acciones destructivas.

---

# 10. BUTTON RULES

Cada contexto debe tener UNA acción primaria.

Correcto:

```text
[Cancelar] [Guardar cambios]
```

Incorrecto:

```text
[Guardar] [Editar] [Actualizar] [Continuar]
```

todos como Primary.

### Orden

```text
Secondary → Primary
```

Ejemplo:

```text
Cancelar → Guardar
```

Para acciones destructivas:

```text
Cancelar → Eliminar
```

---

# 11. BUTTON ICONS

Iconos:

```text
16px → small
18px → standard
20px → large
```

Gap:

```text
8px
```

Ejemplo:

```text
[ +  Crear restaurante ]
```

El icono debe estar alineado verticalmente con el texto.

No utilizar iconos decorativos innecesarios.

---

# 12. INPUT SYSTEM

### Default

```text
height: 40px
padding-x: 12px
font: 14px
radius: 6px
border: #CBD5E1
```

### Large

```text
height: 48px
```

### Small

```text
height: 32px
```

### Focus

```text
border: #2563EB
ring: rgba(37,99,235,0.15)
```

### Error

```text
border: #DC2626
```

Los labels deben estar fuera del input.

Nunca utilizar únicamente placeholder como label.

---

# 13. CARDS

```text
background: #FFFFFF
border: 1px solid #E2E8F0
radius: 10px
padding: 24px
```

No utilizar shadows fuertes.

Una card debe utilizarse para agrupar información relacionada.

No convertir cada pequeño elemento en una card.

---

# 14. BADGES

Height:

```text
24px
```

Padding:

```text
4px 8px
```

Radius:

```text
6px
```

Font:

```text
12px / 500
```

Ejemplo:

```text
● Activo
```

Estados:

```text
Success → green
Warning → amber
Error → red
Info → blue
Neutral → gray
```

---

# 15. SIDEBAR

Desktop:

```text
width: 248px
```

Navigation item:

```text
height: 40px
padding-x: 12px
radius: 6px
```

Gap:

```text
8px
```

### Default

```text
color: #475569
background: transparent
```

### Hover

```text
background: #F8FAFC
```

### Active

```text
background: #EFF6FF
color: #1D4ED8
```

El elemento activo debe ser evidente pero discreto.

---

# 16. NAVBAR

Height:

```text
64px
```

Border:

```text
1px solid #E2E8F0
```

Debe contener únicamente elementos necesarios:

```text
Logo
Restaurant selector
Search
Notifications
Help
Profile
```

No saturar la navegación.

---

# 17. PAGE LAYOUT

Desktop:

```text
Sidebar: 248px
Navbar: 64px
Content padding: 32px
```

Contenido:

```text
max-width: 1440px
```

El contenido debe tener suficiente espacio para respirar.

---

# 18. PAGE HEADER

Estructura:

```text
Título
Descripción
Acción principal
```

Ejemplo:

```text
Productos

Administra los productos disponibles
en tu restaurante.

                         [ + Crear producto ]
```

Título:

```text
24–30px
600–700
```

Descripción:

```text
14–16px
#64748B
```

---

# 19. TABLE SYSTEM

Header:

```text
background: #F8FAFC
font-size: 12px
font-weight: 600
color: #475569
```

Rows:

```text
height: 48–56px
```

Border:

```text
#E2E8F0
```

Hover:

```text
#F8FAFC
```

Evitar líneas verticales innecesarias.

---

# 20. MODAL SYSTEM

```text
width: 480–600px
padding: 24px
radius: 12px
background: #FFFFFF
```

Estructura:

```text
Title
Description
Content
Actions
```

Actions:

```text
Cancelar → Confirmar
```

---

# 21. TOAST SYSTEM

Los Toast deben ser pequeños y discretos.

Ejemplo:

```text
✓ Restaurante actualizado correctamente.
```

No mostrar mensajes técnicos.

Incorrecto:

```text
Error 500 / database constraint violation
```

Correcto:

```text
No fue posible guardar los cambios.
Intenta nuevamente.
```

---

# 22. ICONOGRAPHY

Utilizar:

**Lucide Icons**

Estilo:

- outline
- minimal
- consistente

Stroke:

```text
1.5–2px
```

No mezclar estilos de iconos.

---

# 23. RESPONSIVE

### Desktop

```text
Sidebar visible
Navbar completa
Grid de múltiples columnas
```

### Tablet

```text
Sidebar colapsable
Grid reducido
```

### Mobile

```text
Sidebar → Drawer
```

Los elementos táctiles deben tener como mínimo aproximadamente:

```text
44px
```

de área interactiva.

---

# 24. DASHBOARD

El dashboard debe mostrar primero la información más importante.

Orden:

```text
Page Header

KPI / métricas principales

Gráficos

Actividad / pedidos

Información secundaria
```

No llenar el dashboard con cards innecesarias.

Cada métrica debe responder una pregunta empresarial.

Ejemplo:

```text
Ventas hoy
$2.450.000
+12.4%
```

---

# 25. RESTAURANT UX

La interfaz debe utilizar terminología clara para personas que trabajan en restaurantes.

Preferir:

```text
Pedidos
Productos
Mesas
Clientes
Reservas
Inventario
Ventas
Configuración
```

Evitar terminología excesivamente técnica.

El usuario no debería necesitar conocimientos tecnológicos para utilizar Restro.

---

# 26. HOSPITALITY DETAILS

Agregar pequeños detalles visuales que aporten personalidad de restaurante.

Ejemplos:

- fotografías de comida
- imágenes de restaurantes
- estados de mesas
- indicadores de disponibilidad
- pequeños acentos teal
- iconografía relacionada con operaciones gastronómicas

Pero estos elementos nunca deben competir con la información empresarial.

La interfaz sigue siendo principalmente SaaS.

---

# 27. LANDING PAGE

La landing debe tener:

```text
Navbar

Hero

Social proof

Features

Product screenshots

Benefits

Pricing

FAQ

CTA

Footer
```

Hero:

```text
H1 fuerte
Descripción breve
Primary CTA
Secondary CTA
Visual del producto
```

No utilizar hero excesivamente cargado.

---

# 28. RESPONSIVE BUTTON RULE

Desktop:

```text
Buttons inline
```

Mobile:

```text
Buttons pueden ocupar width completo
```

En formularios mobile:

```text
[Cancelar]
[Guardar cambios]
```

o

```text
[       Guardar cambios       ]
```

dependiendo del contexto.

No crear botones pequeños difíciles de tocar.

---

# 29. ACCESSIBILITY

Todos los componentes interactivos deben tener:

```text
default
hover
focus
active
disabled
```

Los estados no deben depender únicamente del color.

Mantener suficiente contraste.

Los elementos interactivos deben tener un área táctil adecuada.

Los formularios deben tener labels.

Los icon-only buttons deben tener tooltip o accessible label.

---

# 30. ANIMATION

Animaciones rápidas.

```text
150–200ms
```

Utilizar:

```text
opacity
transform
scale mínima
```

No utilizar animaciones exageradas.

La interfaz debe sentirse rápida y profesional.

---

# 31. REGLAS DE COMPOSICIÓN

Cuando el LLM genere una pantalla debe seguir este orden conceptual:

```text
1. Contexto
2. Título
3. Acción principal
4. Información principal
5. Acciones secundarias
6. Información complementaria
```

La interfaz debe tener una jerarquía visual evidente.

---

# 32. REGLA 1-2-3

Cada pantalla debe tener:

### 1 acción primaria

La acción más importante.

### 2 niveles principales de información

Información principal + secundaria.

### 3 niveles de jerarquía visual

```text
Primary
Secondary
Tertiary
```

No crear interfaces donde todo tenga el mismo peso visual.

---

# 33. DO

El LLM DEBE:

- Mantener consistencia entre páginas.
- Reutilizar componentes.
- Utilizar los tokens definidos.
- Priorizar espacios en blanco.
- Mantener jerarquía visual.
- Utilizar azul para acciones importantes.
- Utilizar teal con moderación.
- Mantener botones compactos.
- Utilizar bordes sutiles.
- Mantener layouts limpios.
- Diseñar pensando primero en productividad.
- Mantener una estética SaaS empresarial.

---

# 34. DON'T

El LLM NO DEBE:

- Inventar nuevos colores.
- Inventar nuevos tamaños.
- Utilizar múltiples familias tipográficas.
- Usar gradientes sin justificación.
- Usar glassmorphism.
- Usar sombras fuertes.
- Utilizar botones gigantes.
- Utilizar demasiados botones Primary.
- Hacer todo redondeado.
- Utilizar colores saturados indiscriminadamente.
- Crear cards para absolutamente todo.
- Sobrecargar dashboards.
- Utilizar iconos inconsistentes.
- Crear layouts visualmente ruidosos.
- Sacrificar usabilidad por estética.

---

# 35. REGLA FINAL PARA EL LLM

Antes de generar cualquier nueva pantalla de Restro, verifica:

```text
¿Utiliza los colores del Design System?
¿Utiliza Inter?
¿Respeta el spacing system?
¿Respeta los border radius?
¿Respeta los tamaños de botones?
¿Existe una única acción primaria?
¿Los elementos están correctamente jerarquizados?
¿La interfaz parece un SaaS empresarial?
¿Tiene suficiente personalidad de restaurante?
¿Es consistente con las demás pantallas?
¿Funciona correctamente en mobile?
```

Si una decisión visual no está definida explícitamente, elegir la opción que mejor preserve:

**simplicidad + consistencia + accesibilidad + profesionalismo + usabilidad.**

El objetivo no es crear una interfaz visualmente llamativa.

El objetivo es crear una interfaz que un restaurante pueda utilizar **todos los días durante horas sin sentirse abrumado**.

**RESTRO**

_Technology for restaurants, designed for people._
