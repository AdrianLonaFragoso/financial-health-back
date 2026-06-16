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

const router: Router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const meses = await prisma.month.findMany({
    include: { ingresos: true, gastos: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  res.json(meses);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const mes = await prisma.month.findUnique({
    where: { id },
    include: { ingresos: true, gastos: true },
  });
  if (!mes) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }
  res.json(mes);
});

router.post("/", async (req: Request, res: Response) => {
  const { label, year, month, ingresos, gastos } = req.body;
  const nuevo = await prisma.month.create({
    data: {
      label,
      year,
      month,
      ingresos: { create: ingresos ?? [] },
      gastos: { create: gastos ?? [] },
    },
    include: { ingresos: true, gastos: true },
  });
  res.status(201).json(nuevo);
});

router.post("/import", async (req: Request, res: Response) => {
  const { type, rows } = req.body;

  if (!rows || rows.length === 0) {
    res.status(400).json({ error: "No se proporcionaron datos" });
    return;
  }

  const firstRow = rows[0];
  const metaKeys = new Set(["concepto", "categoria", "fin"]);
  const monthNames = Object.keys(firstRow).filter((k) => !metaKeys.has(k));

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
        const categoria = (row.categoria as string)?.trim() || "Necesidades";
        const fin = (row.fin as string)?.trim() || "indefinido";
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
