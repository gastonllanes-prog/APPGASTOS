# HANDOFF — "Caja" · traspaso completo a Claude Code

Estado a la fecha: **v0.19** (deployado sigue en v0.16 — faltan pushear v0.17/18/19). Con datos reales en Supabase.
Este documento tiene TODO lo necesario para seguir sin contexto previo. Leer junto con `CLAUDE.md`.

### Cambios v0.20
- **Fechas de ciclo de tarjeta corregidas (CYCLES, los dos archivos).** BBVA estaba mal (decía cierre día 2). Reales confirmados por Gastón: **Visa BBVA / Master BBVA {cierre:30, vto:7}** (paga de BBVA C.A., débito automático), **Visa Macro {cierre:23, vto:3}** (paga de Macro C.A., débito automático). Santander sigue en {2,13} hasta que llegue su resumen.
- **Config de pago por tarjeta (dicho por Gastón):** Macro→Macro C.A. (auto-débito, vto 03/08) · BBVA→BBVA C.A. (auto-débito, cierre 30/07 vto 07/08) · **Santander = MANUAL y multi-moneda** (paga en $ y US$ por separado, con dólares billete del ahorro + dólares cuenta + pesos cuenta; NO auto-debita).
- **Percepción USD:** NO es 35% — en el backup figura "Percepción RG 5617 (30%)" ($271.008) → es **30%**. Al pagar los dólares con dólares propios se evita/descuenta. Hacerla **configurable** (cambia seguido en AR).
- **PENDIENTE — Módulo de pago de tarjetas (a diseñar/construir):** (1) auto-débito que LIMPIE la deuda al pagar (si no, cuenta doble: saldo ya bajó + deuda aún visible entre vto y próximo cierre); (2) Santander multi-moneda + pago manual desde varias fuentes; (3) cálculo de la percepción 30% al pagar en dólares. Falta: resumen Santander + montos $ y US$, y el monto de dólares billete.

### Cambios v0.19
- **Ocultar saldos (privacidad).** Botón 👁/🙈 en el topbar (web) y header (PWA). `let HIDE` + `money()`/`moneyU()` devuelven `$ ••••` cuando está activo; `toggleHide()` persiste en `localStorage('caja_hide')` y re-renderiza. Estado compartido web↔PWA (mismo origen). Tapa patrimonio, cuentas, disponible, ahorros y los montos de próximos pagos. Leak menor: el subtexto "cuotas $X" en Próximos pagos (PWA) usa toLocaleString directo, no money() → no se tapa (pulir si molesta).

### PENDIENTE / a construir
- **Cuenta "Dólares billetes" (ahorro USD efectivo):** Gastón la pidió; falta que pase el monto de USD en billete para crearla (tipo=efectivo, moneda=USD, ahorro=true).
- **Fix "Macro a pagar" (card model):** confirmado en vivo que la app muestra $121.475 (solo cuotas) en vez de $339.439 — Prevención (24/07) y La Meridional (23/07) quedan afuera porque su fecha es < el cierre que usa la app (25/07, CYCLES Macro). Son del resumen cerrado (vto 03/08). Fix rápido = re-fechar esos 2 al ciclo abierto; fix bueno = que cardEstimate tome el resumen cerrado. Gastón todavía no dio OK al rápido.

### Cambios v0.18
- **Rediseño "¿Cuánto puedo gastar?" (HECHO, aprobado).** Nuevo `ivaMesActual()` (débito−crédito de comprobantes del mes actual). Disponible hoy = `opPesos − deudaTarj − ivaMes`. La **cuota AFIP** (`vencMes`, de `vencProx()`) YA NO se resta: pasa a "aviso del mes que viene" en la nota + `dispTrasVenc`. La tarjeta se sigue restando. En LOS DOS: `health()` cambiado; en `index.html` el `vPanel` (4 celdas: Pesos / −Tarjetas / −IVA / =Disponible hoy + nota). En `app.html` se **agregó fetch de `comprobantes`** en `load()` y `reload()` (+`DATA.comps`) y el sub-texto del header. Verificado en demo web (IVA $184.800) y PWA (sin errores).
- Nota: el IVA sale de **comprobantes del mes**, no de un vencimiento "IVA DDJJ". Gastón NO carga el IVA como vencimiento (sus vencs son solo las 6 cuotas AFIP), así que está bien. Si algún día carga IVA como vencimiento, revisar (hoy sería un "aviso", no se restaría).

### Cambios v0.17
- **Gastos: filtro por rango de fechas (web).** La pantalla Gastos ahora tiene Desde/Hasta + chips (Este mes / Mes pasado / Todo), estado propio `gRange` (default = mes actual hasta hoy), ignora el toggle global Mes/Todo. Rótulos corregidos ("Gasto del período", ya no "del mes" cuando estaba en Todo — era engañoso). Verificado.
- Contexto: Gastón vio "$4.993.427" de gastos y se asustó; era el toggle en "Todo" (mayo $264.773 + junio $3.851.546 + julio $877.108). Junio alto por el resumen de Visa Santander cargado. "Gastos"=consumo por fecha; "Tarjetas a pagar"=lo que debita. Son lentes distintas.

### PENDIENTE aprobado / a construir (próximo)
- **Rediseño "¿Cuánto puedo gastar?" (APROBADO por Gastón):** restar el **IVA del mes en curso** (débito−crédito de comprobantes del mes actual; él lo paga el 20 del mes siguiente) en lugar de/además de vencimientos; la **cuota AFIP pasa a "aviso del mes que viene"** (no se resta del número de hoy, la cubre con ingresos de agosto); la **tarjeta se sigue restando**. Toca `health()` en LOS DOS archivos + `vPanel` (web) + hay que **agregar fetch de `comprobantes` en app.html** (hoy la PWA no los trae) para calcular IVA. Nuevo helper `ivaMesActual()`.
- **Lectura de factura por foto:** este ticket de combustible (Petrovalle, Factura A, neto $70.703,65 IVA $14.847,77 total $98.002,01) NO tiene QR y el IVA NO es total/1,21 (hay ITC+carbono). Opciones dadas a Gastón: (1) foto→IA visión en Edge Function (cuesta, lee todo), (2) importar "Mis Comprobantes" de ARCA (exacto, gratis, todas juntas — recomendado para bajar IVA), (3) foto+carga manual. Falta que elija.
- **Prueba pendiente:** ofrecí cargar esa factura de compra (crédito $14.847,77 → IVA a pagar 962.684→947.836); espera su OK. Ojo: no hay botón para borrar comprobante en la UI.

### Cambios v0.16
- **Auto-crear cuenta Efectivo (fix, PWA):** v0.15 se subió SIN este fix. Si cargás en "Efectivo" y no tenés cuenta de efectivo, `ensureEfectivo()` la crea sola. (En v0.15 desplegado había que crearla a mano — por eso ya existe una cuenta "Efectivo" en la base.)
- **Texto de Vencimientos:** se sacó el "Ejemplo" con números inventados (3/12, $84.500) que confundía; ahora explica cómo funciona el plan y que solo se descuenta la cuota del próximo mes.
- **Nota de revisión en vivo (27/07):** saldos de banco desfasados respecto al home banking → se corrigen con ✎ saldo. BBVA C.A. 243-56956 mostraba $571.045 vs real **$708.866,74**; Santander C.A. 181-394297 mostraba $943.073 vs real **$1.203.072,91**. NO se tocaron (el clasificador bloquea que el asistente edite saldos; los ajusta Gastón). Ingreso de $156.620 en efectivo cargado OK. RLS verificado activo.

### Cambios v0.15
- **Cuotas de tarjeta que avanzan solas (fix):** nueva función `cuotaCur(m)` (en los dos HTML) calcula la cuota actual HOY = `cuota_actual` + meses transcurridos desde `created_at` (o `fecha` si no hay). Antes quedaban clavadas en 1/N. Ahora: (a) la cuota avanza mes a mes, (b) la **última cuota** (cur==total) SÍ cuenta, (c) cuando termina (cur>total) se cae del cálculo y el estimado baja. Aplica en `cardEstimate`, vista Cuotas, vista Gastos, txHtml y renderTarjetas.
- **"Ajustar saldo" (feature):** botón ✎ en cada cuenta (web: modal `formSaldo`/`saveSaldo`; PWA: `editSaldo` con prompt). Poné lo que dice el banco/tu captura y la vista queda igual. Como `saldo mostrado = saldo_guardado + movimientos`, guarda `objetivo − movimientos`. Sirve para actualizar bancos y **Bull Market** (acciones que cambian). El botón aparece en TODAS las cuentas, incluida la de inversión.
- **Fix carga en Efectivo (PWA):** si pagabas con "Efectivo" y no tenías una cuenta de tipo efectivo, el guardado se abortaba con un banner y no cargaba (Gastón no tiene cuenta efectivo). Ahora `ensureEfectivo()` crea sola la cuenta "Efectivo" (ARS, saldo 0) la primera vez y guarda el movimiento. Verificado.
- **Fix seguridad menor:** `esc()` ahora escapa también `"` y `'` (antes una razón social con comillas rompía el form de factura).
- **RLS verificado:** consulta sin login a `cuentas/movimientos/comprobantes/vencimientos` devuelve `[]` → RLS está activo, los datos no están expuestos con la anon key pública.
- **Dólar:** se deja en 1528 hardcodeado (decisión de Gastón: las cuentas en dólares se usan como tal, no tocar).

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
