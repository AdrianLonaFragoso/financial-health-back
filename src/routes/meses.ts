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

const router: Router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const meses = await prisma.month.findMany({
    include: { ingresos: true, gastos: true, exclusiones: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  // Materializar indefinidos en todos los meses
  for (const m of meses) {
    await materializarIndefinidos(m);
  }

  const actualizados = await prisma.month.findMany({
    include: { ingresos: true, gastos: true, exclusiones: true },
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
    include: { ingresos: true, gastos: true, exclusiones: true },
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
    include: { ingresos: true, gastos: true, exclusiones: true },
  });
  res.json(actualizado);
});

router.post("/", async (req: Request, res: Response) => {
  const { label, year, month, ingresos, gastos, autoPopulate } = req.body;

  let ingresosData = ingresos ?? [];
  let gastosData = gastos ?? [];

  if (autoPopulate) {
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

    if (recent) {
      ingresosData = recent.ingresos.map((i) => ({
        concepto: i.concepto,
        monto: i.monto,
      }));
      gastosData = recent.gastos
        .filter((g) => shouldCopyGasto(g.fin, year, month))
        .map((g) => ({
          concepto: g.concepto,
          monto: g.monto,
          categoria: g.categoria,
          fin: g.fin,
        }));
    }
  }

  const nuevo = await prisma.month.create({
    data: {
      label,
      year,
      month,
      ingresos: { create: ingresosData },
      gastos: { create: gastosData },
    },
    include: { ingresos: true, gastos: true },
  });
  res.status(201).json(nuevo);
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

router.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.month.delete({ where: { id } });
  res.status(204).end();
});

export default router;
