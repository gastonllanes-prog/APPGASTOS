# Caja — app de finanzas + IVA

App de un solo usuario (Responsable Inscripto, Argentina). Frontend estático; backend en Supabase.

## Archivos
- `index.html` — panel web (escritorio).
- `app.html` — PWA para el celular (instalable: "Agregar a pantalla de inicio").
- `manifest.json`, `service-worker.js`, `icon-*.png` — para la PWA.

## Publicar (GitHub + Vercel)
1. Crear un repo en GitHub (ej. `caja`) y subir esta carpeta.
2. En vercel.com → New Project → importar el repo. Framework preset: **Other** (es estático). Deploy.
3. Vercel da una URL HTTPS (ej. `https://caja-tuusuario.vercel.app`).
   - Panel web: esa URL (o `.../index.html`).
   - App del celular: `.../app.html` → abrir en el celular → menú → "Agregar a pantalla de inicio".

## Notas
- La `anon key` de Supabase está embebida a propósito (es pública, protegida por RLS). No es un secreto.
- No commitear nunca la `service_role` key.
