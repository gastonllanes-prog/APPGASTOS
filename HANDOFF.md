# HANDOFF — "Caja" · traspaso completo a Claude Code

Estado a la fecha: **v0.14**, en producción en GitHub Pages, con datos reales en Supabase.
Este documento tiene TODO lo necesario para seguir sin contexto previo. Leer junto con `CLAUDE.md`.

### Cambios v0.14
- **Repositorio de resúmenes para el contador (roadmap 1 — HECHO):** pestaña "Resúmenes" en web y PWA. Sube PDF/imagen por banco a Storage (bucket privado `comprobantes`, ruta `{uid}/resumenes/{banco}/{ts}-{archivo}`), lista por banco, descarga individual y **"Descargar todo"** = ZIP por banco (JSZip lazy por CDN). Sin tabla nueva: el listado sale del propio Storage. Las políticas de Storage del bucket `comprobantes` ya estaban (owner-only), no hizo falta SQL. Período se parsea del nombre del archivo (busca `YYYY-MM`/`MM-YYYY`).
- **Fix "impuestos por vencer" (plan de pagos):** el cálculo de "disponible para gastar" sumaba TODAS las cuotas del plan AFIP (6 × $616.862 = $3.701.174). Ahora `vencProx()` cuenta **solo lo que vence hasta 1 mes hacia adelante** (la cuota del próximo mes). La vista Vencimientos muestra un resumen "A pagar el mes que viene" vs "Total pendiente (todo el plan)" y sigue listando el plan completo.

---

## 1. Archivos del repo (APPGASTOS)

| Archivo | Qué es |
|---|---|
| `index.html` | Panel web (escritorio). SPA de un archivo. |
| `app.html` | PWA del celular (v0.13). Instalable. |
| `manifest.json`, `service-worker.js`, `icon-192/512.png` | PWA. SW es **network-first**; su `CACHE` se llama `caja-vX` y hay que renombrarlo en cada release. |
| `logos/` | Logos PNG: santander, macro, bbva, mercadopago, visa, mastercard, amex. El usuario dio permiso de uso. |
| `README.md`, `vercel.json`, `CLAUDE.md`, `HANDOFF.md` | Docs / config. |

`index.html` y `app.html` son gemelos: **todo cambio va en los dos**.

---

## 2. Modelo de datos (Supabase Postgres, RLS en todo)

Tablas y columnas ya migradas (todas con `user_id`, `created_at`, `updated_at`):

- **cuentas**: `tipo` (banco|tarjeta|efectivo|inversion), `nombre`, `moneda` (ARS|USD), `saldo`, `archivada`, **`ahorro` boolean** (migración `ahorro_alter.sql`). `ahorro=true` ⇒ es ahorro (no cuenta como operativo). Bull Market siempre es ahorro.
- **categorias**: `nombre`, `padre_id`, `tipo`, `emoji`.
- **movimientos**: `cuenta_id`, `categoria_id`, `comprobante_id`, `fecha`, `tipo` (ingreso|gasto|transferencia), `monto`, `ambito` (personal|actividad), `descripcion`, **`tarjeta` text**, **`cuota_actual` int**, **`cuota_total` int** (migración `schema_alter.sql`). Convención: consumo de tarjeta ⇒ `tarjeta` seteada y `cuenta_id=null` (modelo devengado: no toca el saldo del banco hasta que se paga el resumen).
- **comprobantes**: `tipo` (A|B|C), `cuit_emisor`, `razon_social`, `punto_venta`, `numero`, `fecha`, `neto`, `iva`, `total`, `cae`, `ambito`, `origen` (qr|ocr|manual), `archivo_url`, **`direccion` (venta|compra)** (migración `iva_alter.sql`). venta⇒débito fiscal, compra⇒crédito.
- **vencimientos** (creada en `schema_alter.sql`): `concepto`, `cuenta_id`, `monto`, `vence`, `cuota_actual`, `cuota_total`, `saldo_pendiente`, `estado` (pendiente|pagado).
- **reglas**, **iva_periodos**: definidas, sin uso intensivo aún.
- **Storage**: bucket privado `comprobantes` (aún no se suben archivos desde el front — es parte del roadmap "repositorio").

**Migraciones ya corridas** (viven fuera del repo por seguridad; el esquema base está en `supabase_schema.sql`): `schema_alter.sql`, `iva_alter.sql`, `ahorro_alter.sql`. Los SQL con **datos reales** (saldos, consumos, plan AFIP) NO están en el repo público.

---

## 3. Convenciones y lógica clave (están en el JS de ambos HTML)

- **Patrimonio = operativo (sin ahorros).** `health()` separa: `opPesos`, `opUsd` (cuentas !ahorro) vs `ahoPesos`, `ahoUsd` (ahorro: Bull + efectivo/dólares marcados). El número grande del panel es lo operativo; los ahorros van aparte.
- **"Disponible para gastar"** = `opPesos − deudaTarjetas − vencimientosPendientes`.
- **Deuda de tarjeta = hacia adelante**, no el resumen ya vencido. `cardEstimate(card)` = cuotas que siguen (`cuota_actual<cuota_total`) + consumos del ciclo abierto (fecha > último cierre). Esto evita contar dos veces lo ya pagado.
- **Ciclos de tarjeta** `CYCLES = {tarjeta: {cierre, vto}}`. Cada tarjeta debita de una cuenta (`CARD_ACCT`). Límites conocidos en `CARD_LIMIT` (solo BBVA por ahora). "Disponible en la tarjeta" = límite − usado.
- **Logos:** `LOGO_BANK` (banco→png), `netLogo(card)` (visa/master/amex), `logoBadge(bank)`. Tarjetas y cuentas se renderizan como tiles tipo tarjeta de crédito (color de banco + logo + red).
- **Parser de Factura AFIP** (en `index.html`): `pdfToText()` reconstruye líneas por posición (x,y) — imprescindible porque pdf.js entrega texto desordenado — y `parseFactura()` saca tipo, neto, IVA, total, CAE, fecha y detecta venta/compra comparando el CUIT emisor con el de Gastón (`20292416815`). Verificado con facturas reales. Arrastrar PDF en la pestaña IVA lo carga.

---

## 4. Datos reales cargados

- **7 cuentas**: Macro C.A., Santander C.A. $ y U$S, BBVA C.A. $, C.C. $ y U$S, Bull Market (inversión, ahorro), + Mercado Pago (saldo 0). 
- **Tarjetas** (6): Visa Macro, Visa Santander, Visa Santander (Nancy, adicional de la esposa), Visa BBVA (solo comisión anual), Master BBVA (dormida, $0, límite $10M), Amex Santander (dormida, $0). Consumos con **fecha real** parseados de los resúmenes.
- **2 facturas de venta** de julio (FG Conexiones S.R.L.). Débito IVA julio ≈ $962.683.
- **Plan AFIP W389999** (Ganancias+Bienes Personales): 6 cuotas de **$616.862,26**, 1er vto **16 de cada mes** (16/08 la primera), debita de **BBVA 243-56956**. 2° vto (día 26) con interés. Cargado en `vencimientos`.
- **Alquiler** $590.000/mes (Jorge Rathhof) desde BBVA.

---

## 5. Restricciones del entorno de desarrollo (heredadas)

- El sandbox de desarrollo **no alcanza `*.supabase.co` ni CDNs de fuentes** ⇒ las escrituras a la base se entregan como **.sql** que el usuario corre en Supabase (o se ejecutan en su navegador logueado). Las pruebas visuales son con `#demo` (dataset embebido) + Playwright.
- **Deploy:** el asistente escribe los archivos en la carpeta local del repo (`~/Desktop/APPGASTOS`) y el usuario hace **Commit + Push** en GitHub Desktop. Claude Code, en cambio, puede hacer git directamente — mejor.
- Login: el mail real es `gaston.llanes@gmail.com` (con punto). No tipear contraseñas por el usuario.

---

## 6. Roadmap pendiente (prioridad sugerida)

1. ~~**Repositorio de resúmenes para el contador**~~ **HECHO en v0.14** (ver "Cambios v0.14"). Guardado en `comprobantes/{uid}/resumenes/{banco}/`, listado desde Storage, descarga individual + ZIP por banco. Pendiente opcional: vincular un resumen a su comprobante/vencimiento.
2. **Transferencias entre cuentas propias** (banco → Mercado Pago): mover saldo sin contar como gasto/ingreso. Modelar como movimiento `transferencia` con origen y destino (falta columna `cuenta_destino_id` o dos asientos).
3. **Gastos fijos** (Alquiler, gym): definir una vez, aparecen cada mes en "próximos pagos", marcar pagado + cómo se pagó, y **pausar** (vacaciones). Tabla nueva o reuso de `vencimientos` con flag recurrente + pausa.
4. **Factura por foto/QR al cargar** (web y celular): "¿Te dieron factura?" → **leer el QR de AFIP** (exacto: `afip.gob.ar/fe/qr/?p=BASE64` → `atob` → JSON) con cámara o imagen; y PDF (ya resuelto en web, portar a la PWA). OCR de foto sin QR = último recurso, vía Edge Function (no exponer API key).
5. **Límites de compra Santander y Macro** (para "disponible"): el resumen Santander los muestra en U$S (raro), Macro no vino completo. Pedir al usuario o parsear cuando lleguen. Cargar en `CARD_LIMIT`.
6. **Faltantes de datos:** detalle de consumos de Mastercard/Amex si dejan de estar dormidas; cualquier tarjeta nueva.

---

## 7. Primer prompt sugerido para Claude Code

> Sos el nuevo dev de "Caja". Leé `CLAUDE.md` y `HANDOFF.md` en la raíz del repo APPGASTOS antes de tocar nada. Es una app de finanzas+IVA de un solo usuario, HTML de un archivo (`index.html` web, `app.html` PWA), backend Supabase, hosteada en GitHub Pages. Mantené la simplicidad (no reescribir a framework sin motivo). Todo cambio va en los dos HTML, subiendo versión y renombrando el caché del service worker. Usá skills cuando apliquen. No subas datos reales ni claves al repo (es público). Arrancá confirmándome el estado actual y proponéme cómo encarar el "repositorio de resúmenes para el contador" (punto 1 del roadmap).

---

*Traducción de necesidades ↔ instrucciones técnicas: el usuario mantiene un chat aparte (con otro asistente) que oficia de "traductor". Este documento es la fuente de verdad del estado del proyecto.*
