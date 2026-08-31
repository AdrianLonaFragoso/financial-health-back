# Cortes Mensuales Automáticos

> **Garantía:** este flujo nunca borra datos existentes. Solo crea un nuevo `Month` si no existe (`year,month`). Junio–Agosto 2026 y todos los `Ingreso/Gasto/Credito` permanecen intactos.

## Flujo

1. **Cron primario (sin intervención):** Vercel Cron `0 6 1 * *` → `06:00 UTC = 00:00 America/Mexico_City` día 1 → `GET /api/cron/ensure-month`.
2. **Fallback lazy:** `GET /api/meses` también llama `ensureCurrentMonth()` antes de listar. Si el cron falló o se desplegó a mitad de mes, el primer acceso crea el corte de forma idempotente. No duplica por `@@unique([year,month])`.

## Qué se copia (decisiones usuario)

- **Ingresos:** se copian completos del último mes anterior (`Sueldo`, `Vales`, etc.).
- **Gastos:** se copian solo los vigentes:
  - `fin = "indefinido"` → siempre (Renta, Plan ATT, Internet...)
  - `fin = "DD-mmm-YY"` → solo si `shouldCopyGasto` es true (`endYear > year || endMonth >= month`). Ej. `YTP 01-dic-26` sí en Sep-26; `ByeByeBelly 01-ago-26` no en Sep-26.
- **Variables nuevos:** empiezan en 0 hasta que se agregan en `GastosMensuales`.
- **Mes anterior:** sigue editable (no se cierra).

## Zona horaria

`America/Mexico_City` vía `new Date(toLocaleString(..., {timeZone:"America/Mexico_City"}))` tanto en cron como en `MonthContext` frontend. Evita creación desfasada por UTC.

## Seguridad / idempotencia

- `prisma/schema.prisma` `@@unique([year,month])` + migración `20260915_add_month_unique/migration.sql` (solo `CREATE UNIQUE INDEX IF NOT EXISTS`, nunca `DELETE`).
- `ensureCurrentMonth` hace `findFirst` → si existe retorna; `create` con `try/catch` unique violation → fallback `findFirst` (race cron vs lazy).
- `materializarIndefinidos` no borra, solo inserta si no existe concepto y no está excluido.

## Anticipación trimestral y meses faltantes

- **Auto actual:** día 1 00:00 MX crea solo `mxNow` (ej. Septiembre). No crea futuro solo.
- **Anticipar manual (trimestral, ambos lados):**
  - Topbar `GlobalMonthSelector` → botón “Anticipar” popover con `missingMonths` (retro, huecos entre primer mes y `mxNow`) + `next 3` (Oct/Nov/Dic) con preview `ingresos/gastos (fijos+vigentes)` y `source`.
  - Dashboard → “Anticipar meses” modal con checkboxes trimestrales + faltantes, preview en vivo (`GET /api/meses/preview-bulk?count=3` y `GET /api/meses/preview?year&month`), bulk `POST /api/meses/bulk {months:[{year,month}...]}` secuencial para mantener cadena de copia (Oct copia de Sep recién creado).
  - Al crear se autoselecciona el último mes creado (`setSelectedMonth(last.id)`); al re-entrar a la app `MonthContext` vuelve a `mxNow` (`currentLabel`).
- **Preview:** `GET /api/meses/preview?year=2026&month=9` → `{ingresos:3,gastos:15,fijos:8,vigentes:7,source:"Agosto 2026",exists}`; `GET /api/meses/preview-bulk?count=3` → `{next:[...],missing:[...]}`.
- **Faltantes retro:** si falta Mayo entre Junio y Agosto, se detecta escaneando `Month` entre `min` y `mxNow`; se puede crear retro sin afectar meses posteriores (copia del inmediato anterior existente).
- **Sincronización:** anticipar Sep hoy evita que el cron del 1-Sep duplique (unique). Bulk anticipar 3 meses = 3 inserts ordenados cronológicamente.

## Operación

- **Vercel:** configurar env `CRON_SECRET` (opcional pero recomendado). Cron envía `x-vercel-cron:1` y pasa sin secret. Manual requiere `Authorization: Bearer $CRON_SECRET` o `?secret=...`.
- **Local test:** `curl http://localhost:3001/api/cron/ensure-month` → `{created:true, month:{label:"Septiembre 2026"...}}` segunda vez `{created:false}`.
- **Anticipar manual:** `curl http://localhost:3001/api/meses/preview-bulk?count=3` y `curl -X POST http://localhost:3001/api/meses/bulk -H "Content-Type: application/json" -d '{"months":[{"year":2026,"month":9},{"year":2026,"month":10}]}'`
- **Producción:** `curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/ensure-month`
- **Verificación:** `SELECT year,month,label FROM "Month" ORDER BY year,month;` debe mostrar meses anticipados + nuevo mes al día 1 sin perder anteriores.

## Riesgos mitigados

- Duplicado por concurrencia → unique index + catch.
- Mes faltante si nadie entra → cron lo crea aunque haya 0 visitas.
- Indefinidos duplicados → `existingSet` + `excludedSet` lo evita.

## Futuro

- Si se quiere cerrar mes, añadir `status` y bloquear `PUT/DELETE` pasado cierto día.
- Si se quiere empezar algún mes totalmente en 0, usar `POST /api/meses {empty:true}` manual.
