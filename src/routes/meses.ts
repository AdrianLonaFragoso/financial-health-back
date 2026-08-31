import { Router, Request, Response } from "express";
import prisma from "../db";

const MONTH_NAME_MAP: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4,
  mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function shouldCopyGasto(fin: string, newYear: number, newMonth: number): boolean {
  if (fin === "indefinido") return true;
  const parts = fin.split("-");
  if (parts.length !== 3) return false;
  const monthStr = parts[1]?.toLowerCase();
  const yearStr = parts[2];
  const endMonth = MONTH_NAME_MAP[monthStr ?? ""];
  const endYear = 2000 + parseInt(yearStr ?? "0", 10);
  if (!endMonth || isNaN(endYear)) return false;
  return endYear > newYear || (endYear === newYear && endMonth >= newMonth);
}

const MESES_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getMxNow(): { year: number; month: number; day: number } {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export async function ensureCurrentMonth(): Promise<{ created: boolean; month: { id: string; label: string; year: number; month: number } | null }> {
  const { year, month } = getMxNow();
  const existing = await prisma.month.findFirst({ where: { year, month } });
  if (existing) return { created: false, month: existing };

  const recent = await prisma.month.findFirst({
    where: {
      OR: [
        { year: { lt: year } },
        { year, month: { lt: month } },
      ],
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { ingresos: true, gastos: true },
  });

  const label = `${MESES_LABELS[month - 1]} ${year}`;

  // Decisión usuario: ingresos copiar completos, gastos fijos + con fin vigente copiados. Preservar metodoPago/creditoId.
  const ingresosData = recent ? recent.ingresos.map((i) => ({ concepto: i.concepto, monto: i.monto })) : [];
  const gastosData = recent
    ? recent.gastos.filter((g) => shouldCopyGasto(g.fin, year, month)).map((g) => ({
        concepto: g.concepto,
        monto: g.monto,
        categoria: g.categoria,
        fin: g.fin,
        metodoPago: (g as unknown as { metodoPago?: string }).metodoPago ?? "efectivo",
        creditoId: (g as unknown as { creditoId?: string | null }).creditoId ?? null,
      }))
    : [];

  try {
    const nuevo = await prisma.month.create({
      data: {
        label,
        year,
        month,
        ingresos: { create: ingresosData },
        gastos: { create: gastosData },
      },
    });
    return { created: true, month: nuevo };
  } catch (err: unknown) {
    // Unique violation (race between cron and lazy) -> return existing safely, no deletion
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique") || msg.includes("unique") || msg.includes("duplicate")) {
      const fallback = await prisma.month.findFirst({ where: { year, month } });
      return { created: false, month: fallback };
    }
    throw err;
  }
}

const router: Router = Router();

router.get("/", async (_req: Request, res: Response) => {
  // Fallback lazy: asegura corte del mes actual sin borrar nada (idempotente)
  await ensureCurrentMonth();

  const meses = await prisma.month.findMany({
    include: { ingresos: true, gastos: { include: { credito: true } }, exclusiones: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  // Materializar indefinidos en todos los meses (preserva metodoPago/creditoId)
  for (const m of meses) {
    await materializarIndefinidos(m);
  }

  const actualizados = await prisma.month.findMany({
    include: { ingresos: true, gastos: { include: { credito: true } }, exclusiones: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  res.json(actualizados);
});

async function materializarIndefinidos(mes: { id: string; year: number; month: number }) {
  const existingConceptos = await prisma.gasto.findMany({
    where: { monthId: mes.id },
    select: { concepto: true },
  });
  const existingSet = new Set(existingConceptos.map((g) => g.concepto));

  const exclusiones = await prisma.gastoExclusion.findMany({
    where: { monthId: mes.id },
    select: { concepto: true },
  });
  const excludedSet = new Set(exclusiones.map((e) => e.concepto));

  const indefinidos = await prisma.gasto.findMany({
    where: {
      fin: "indefinido",
      NOT: { monthId: mes.id },
      month: {
        OR: [
          { year: { lt: mes.year } },
          { year: mes.year, month: { lt: mes.month } },
        ],
      },
    },
  });

  const seenConceptos = new Set<string>();
  let creados = 0;
  for (const g of indefinidos) {
    if (seenConceptos.has(g.concepto)) continue;
    seenConceptos.add(g.concepto);
    if (existingSet.has(g.concepto)) continue;
    if (excludedSet.has(g.concepto)) continue;

    await prisma.gasto.create({
      data: {
        monthId: mes.id,
        concepto: g.concepto,
        monto: g.monto,
        categoria: g.categoria,
        fin: g.fin,
        metodoPago: (g as unknown as { metodoPago?: string }).metodoPago ?? "efectivo",
        creditoId: (g as unknown as { creditoId?: string | null }).creditoId ?? null,
      },
    });
    creados++;
  }
  return creados;
}

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const mes = await prisma.month.findUnique({
    where: { id },
    include: { ingresos: true, gastos: { include: { credito: true } }, exclusiones: true },
  });
  if (!mes) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }
  // Auto-materializar gastos indefinidos de meses anteriores
  await materializarIndefinidos(mes);

  // Refetch con datos actualizados
  const actualizado = await prisma.month.findUnique({
    where: { id },
    include: { ingresos: true, gastos: { include: { credito: true } }, exclusiones: true },
  });
  res.json(actualizado);
});

async function buildCopyData(year: number, month: number) {
  const recent = await prisma.month.findFirst({
    where: {
      OR: [
        { year: { lt: year } },
        { year, month: { lt: month } },
      ],
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { ingresos: true, gastos: true },
  });
  if (!recent) return { ingresosData: [] as { concepto: string; monto: number }[], gastosData: [] as { concepto: string; monto: number; categoria: string; fin: string; metodoPago: string; creditoId: string | null }[], source: null as string | null };
  const ingresosData = recent.ingresos.map((i) => ({ concepto: i.concepto, monto: i.monto }));
  const gastosData = recent.gastos.filter((g) => shouldCopyGasto(g.fin, year, month)).map((g) => ({
    concepto: g.concepto,
    monto: g.monto,
    categoria: g.categoria,
    fin: g.fin,
    metodoPago: (g as unknown as { metodoPago?: string }).metodoPago ?? "efectivo",
    creditoId: (g as unknown as { creditoId?: string | null }).creditoId ?? null,
  }));
  // Si creditoId ya no existe (fue borrado), degradar a efectivo para no fallar
  if (gastosData.some((g) => g.creditoId)) {
    const ids = [...new Set(gastosData.filter((g) => g.creditoId).map((g) => g.creditoId!))];
    const existentes = await prisma.credito.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const existSet = new Set(existentes.map((c) => c.id));
    for (const g of gastosData) if (g.creditoId && !existSet.has(g.creditoId)) { g.creditoId = null; g.metodoPago = "efectivo"; }
  }
  return { ingresosData, gastosData, source: recent.label };
}

// Preview endpoint: what would be copied for a future/missing month (no write)
router.get("/preview", async (req: Request, res: Response) => {
  const year = parseInt(String(req.query.year), 10);
  const month = parseInt(String(req.query.month), 10);
  if (!year || !month || month < 1 || month > 12) {
    res.status(400).json({ error: "Parámetros year y month requeridos (1-12)" });
    return;
  }
  const exists = await prisma.month.findFirst({ where: { year, month } });
  if (exists) {
    res.json({ year, month, label: exists.label, exists: true, ingresos: exists.id, gastos: 0, preview: null });
    return;
  }
  const { ingresosData, gastosData, source } = await buildCopyData(year, month);
  const fijos = gastosData.filter((g) => g.fin === "indefinido").length;
  const vigentes = gastosData.length - fijos;
  res.json({
    year,
    month,
    label: `${MESES_LABELS[month - 1]} ${year}`,
    exists: false,
    source,
    ingresos: ingresosData.length,
    gastos: gastosData.length,
    fijos,
    vigentes,
    ingresosDet: ingresosData,
    gastosDet: gastosData,
  });
});

router.get("/preview-bulk", async (req: Request, res: Response) => {
  const count = Math.min(Math.max(parseInt(String(req.query.count ?? "3"), 10) || 3, 1), 6);
  const startYear = parseInt(String(req.query.year), 10);
  const startMonth = parseInt(String(req.query.month), 10);
  let base: { year: number; month: number };
  if (startYear && startMonth) base = { year: startYear, month: startMonth };
  else {
    const mx = getMxNow();
    base = mx;
  }
  const results = [];
  for (let i = 1; i <= count; i++) {
    let y = base.year, m = base.month + i;
    while (m > 12) { m -= 12; y += 1; }
    const exists = await prisma.month.findFirst({ where: { year: y, month: m } });
    if (exists) {
      results.push({ year: y, month: m, label: exists.label, exists: true });
    } else {
      const { ingresosData, gastosData, source } = await buildCopyData(y, m);
      results.push({
        year: y, month: m, label: `${MESES_LABELS[m - 1]} ${y}`, exists: false, source,
        ingresos: ingresosData.length, gastos: gastosData.length,
        fijos: gastosData.filter((g) => g.fin === "indefinido").length,
        vigentes: gastosData.filter((g) => g.fin !== "indefinido").length,
      });
    }
  }
  // Also missing months backwards
  const all = await prisma.month.findMany({ orderBy: [{ year: "asc" }, { month: "asc" }] });
  const missing: { year: number; month: number; label: string }[] = [];
  if (all.length > 0) {
    const min = all[0], mx = getMxNow();
    let y = min.year, m = min.month;
    const existsSet = new Set(all.map((a) => `${a.year}-${a.month}`));
    while (y < mx.year || (y === mx.year && m < mx.month)) {
      if (!existsSet.has(`${y}-${m}`)) missing.push({ year: y, month: m, label: `${MESES_LABELS[m - 1]} ${y}` });
      m += 1; if (m > 12) { m = 1; y += 1; }
    }
  }
  res.json({ next: results, missing });
});

// Bulk create for trimestral anticipation (sequential to keep copy chain)
router.post("/bulk", async (req: Request, res: Response) => {
  const { months } = req.body as { months: { year: number; month: number }[] };
  if (!Array.isArray(months) || months.length === 0 || months.length > 6) {
    res.status(400).json({ error: "months debe ser array de 1 a 6 elementos {year,month}" });
    return;
  }
  // Sort chronologically to keep copy chain correct (missing first, then future)
  const sorted = [...months].sort((a, b) => a.year - b.year || a.month - b.month);
  const created = [];
  const skipped = [];
  for (const { year, month } of sorted) {
    if (!year || !month || month < 1 || month > 12) {
      skipped.push({ year, month, reason: "Datos inválidos" });
      continue;
    }
    const exists = await prisma.month.findFirst({ where: { year, month } });
    if (exists) {
      skipped.push({ year, month, label: exists.label, reason: "Ya existe" });
      continue;
    }
    const { ingresosData, gastosData } = await buildCopyData(year, month);
    const label = `${MESES_LABELS[month - 1]} ${year}`;
    try {
      const nuevo = await prisma.month.create({
        data: { label, year, month, ingresos: { create: ingresosData }, gastos: { create: gastosData } },
        include: { ingresos: true, gastos: { include: { credito: true } } },
      });
      created.push(nuevo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unique") || msg.includes("unique") || msg.includes("duplicate")) {
        skipped.push({ year, month, reason: "Ya existe (race)" });
      } else {
        skipped.push({ year, month, reason: msg });
      }
    }
  }
  res.status(201).json({ created, skipped });
});

router.post("/", async (req: Request, res: Response) => {
  const { label, year, month, ingresos, gastos, autoPopulate } = req.body;

  let ingresosData = ingresos ?? [];
  let gastosData = gastos ?? [];

  if (autoPopulate) {
    const { ingresosData: id, gastosData: gd } = await buildCopyData(year, month);
    ingresosData = id;
    gastosData = gd;
  }

  try {
    const nuevo = await prisma.month.create({
      data: {
        label,
        year,
        month,
        ingresos: { create: ingresosData },
        gastos: { create: gastosData },
      },
      include: { ingresos: true, gastos: { include: { credito: true } } },
    });
    res.status(201).json(nuevo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique") || msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: `El mes ${label ?? `${month}/${year}`} ya existe` });
      return;
    }
    throw err;
  }
});

function normalizeImportKey(k: string) {
  const lower = k.toLowerCase().trim();
  if (lower === "categoría") return "categoria";
  if (lower === "vencimiento") return "fin";
  return lower;
}

router.post("/import", async (req: Request, res: Response) => {
  const { type, rows } = req.body;

  if (!rows || rows.length === 0) {
    res.status(400).json({ error: "No se proporcionaron datos" });
    return;
  }

  const firstRow = rows[0];
  const rawKeys = Object.keys(firstRow);
  const metaKeys = new Set(["concepto", "categoria", "fin"]);
  const monthNames = rawKeys.filter((k) => !metaKeys.has(normalizeImportKey(k)));

  if (monthNames.length === 0) {
    res.status(400).json({ error: "No se encontraron columnas de meses en el CSV" });
    return;
  }

  const currentYear = new Date().getFullYear();
  const monthRecords: Record<string, string> = {};

  for (const monthName of monthNames) {
    const normalized = monthName.toLowerCase().trim();
    const monthIndex = MONTH_NAME_MAP[normalized];
    if (!monthIndex) {
      res.status(400).json({ error: `Nombre de mes inválido: "${monthName}"` });
      return;
    }

    let month = await prisma.month.findFirst({
      where: { year: currentYear, month: monthIndex },
    });

    if (!month) {
      const label = `${capitalize(normalized)} ${currentYear}`;
      month = await prisma.month.create({
        data: { label, year: currentYear, month: monthIndex },
      });
    }

    monthRecords[monthName] = month.id;
  }

  let created = 0;
  for (const row of rows) {
    const concepto = (row.concepto as string)?.trim();
    if (!concepto) continue;

    for (const monthName of monthNames) {
      const raw = row[monthName];
      const value = typeof raw === "number" ? raw : parseFloat(raw);
      if (isNaN(value) || value <= 0) continue;

      const monthId = monthRecords[monthName];

      if (type === "gasto") {
        const categoria = (row.categoria as string)?.trim() || (row["categoría"] as string)?.trim() || "Necesidades";
        const fin = (row.fin as string)?.trim() || (row.vencimiento as string)?.trim() || "indefinido";
        await prisma.gasto.create({
          data: { monthId, concepto, monto: value, categoria, fin },
        });
      } else {
        await prisma.ingreso.create({
          data: { monthId, concepto, monto: value },
        });
      }
      created++;
    }
  }

  res.status(201).json({ created, months: Object.keys(monthRecords).length });
});

router.put("/:id/plan", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { necesidades, estiloVida, ahorro } = req.body;

  if (
    typeof necesidades !== "number" ||
    typeof estiloVida !== "number" ||
    typeof ahorro !== "number" ||
    !Number.isFinite(necesidades) ||
    !Number.isFinite(estiloVida) ||
    !Number.isFinite(ahorro) ||
    necesidades < 0 ||
    estiloVida < 0 ||
    ahorro < 0 ||
    Math.round((necesidades + estiloVida + ahorro) * 100) / 100 !== 100
  ) {
    res.status(400).json({ error: "Los porcentajes deben sumar 100" });
    return;
  }

  const existing = await prisma.month.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }

  const actualizado = await prisma.month.update({
    where: { id },
    data: { necesidades, estiloVida, ahorro },
    include: { ingresos: true, gastos: true, exclusiones: true },
  });
  res.json(actualizado);
});

router.delete("/:id/plan", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.month.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }

  const actualizado = await prisma.month.update({
    where: { id },
    data: { necesidades: null, estiloVida: null, ahorro: null },
    include: { ingresos: true, gastos: true, exclusiones: true },
  });
  res.json(actualizado);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.month.delete({ where: { id } });
  res.status(204).end();
});

export default router;
