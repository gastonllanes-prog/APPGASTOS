# CLAUDE.md — Proyecto "Caja" (memoria para Claude Code)

App de finanzas personales + fiscal (IVA/AFIP) para **Gastón Llanes**, Responsable Inscripto en Posadas, Misiones (Argentina). Un solo usuario. **Leé este archivo y `HANDOFF.md` antes de tocar nada.**

## Regla de oro
La solución **más simple** que resuelva bien. La app hoy es **HTML de un solo archivo, sin build ni framework** — y funciona en producción. **No la reescribas a React/Vite** salvo que una función concreta lo exija y lo acuerdes con el usuario. No metas complejidad prematura.

## Usá skills
Cuando produzcas documentos (docx/pdf/xlsx/pptx), datos, o cualquier cosa con skill disponible, **usá el skill** en vez de improvisar. El usuario lo pidió explícitamente.

## Qué es (diferencial)
Consolida cuentas, tarjetas, cuotas, gastos, ingresos, IVA y vencimientos. El diferencial: **un mismo comprobante alimenta gasto + IVA**. Sacar/leer una Factura A registra el gasto y suma crédito/débito fiscal.

## Stack REAL (no el del PRD viejo)
- **Frontend:** dos archivos HTML autocontenidos, sin bundler:
  - `index.html` = panel web (escritorio).
  - `app.html` = PWA del celular (instalable).
  - Cargan `@supabase/supabase-js@2` y `pdfjs-dist@3` por CDN (jsDelivr). Fuentes por Google Fonts.
- **Backend:** Supabase (Postgres + Auth + RLS + Storage). Ref del proyecto: `chrbcnmnhraelnzekhtr`. La **anon key** está embebida en el HTML: es **pública por diseño** (protegida por RLS), NO es secreto. La **service_role key NUNCA** va al cliente ni al repo.
- **Hosting:** GitHub Pages, repo `gastonllanes-prog/APPGASTOS` (**público**). URL: `https://gastonllanes-prog.github.io/APPGASTOS/` (web) y `.../app.html` (PWA).
- **user_id de Gastón:** `9d8ae0a4-ffe8-4740-913e-6c56f060c314`.

## Cómo se despliega (importante)
No hay CI. El repo se edita local y el usuario hace **Commit + Push** en **GitHub Desktop**. Regla al cambiar algo:
1. Tocar SIEMPRE **los dos** archivos (`index.html` y `app.html`) para que web y celular queden iguales (datos y visual).
2. Subir la **versión** (`const VERSION`/sello visible) y cambiar el **nombre de caché** del `service-worker.js` (`CACHE='caja-vX'`), si no la caché sirve lo viejo.
3. Si agregás assets (ej. `logos/`), asegurate de commitearlos o en la web quedan rotos.

## Seguridad (no negociable)
- RLS activado en el 100% de las tablas; política `using ((select auth.uid()) = user_id)`.
- El repo es **público**: **NO** subir SQL con datos reales (saldos, CUIT, consumos) ni la service_role key. Solo esquema.
- No guardar números completos de tarjeta (PCI).

## Verificar antes de terminar
Probar el flujo (Playwright + screenshot sirve). Chequear que web y app coinciden. En datos fiscales: `total = neto + IVA`.
