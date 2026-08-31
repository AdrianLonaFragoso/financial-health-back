import { Router, Request, Response } from "express";
import prisma from "../db";

const router: Router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const creditos = await prisma.credito.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(creditos);
});

router.post("/", async (req: Request, res: Response) => {
  const { tipo, nombre, logoUrl, lineaCredito, saldoUtilizado, tasaInteresMensual, usuario, pagoMensual, pagosRealizados, pagosCompletados, pagosTotales } = req.body;

  const credito = await prisma.credito.create({
    data: {
      tipo,
      nombre,
      logoUrl,
      lineaCredito,
      saldoUtilizado,
      tasaInteresMensual,
      usuario,
      pagoMensual,
      pagosRealizados,
      pagosCompletados,
      pagosTotales,
    },
  });
  res.status(201).json(credito);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.credito.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Crédito no encontrado" });
    return;
  }

  const { tipo, nombre, logoUrl, lineaCredito, saldoUtilizado, tasaInteresMensual, usuario, pagoMensual, pagosRealizados, pagosCompletados, pagosTotales } = req.body;
  const credito = await prisma.credito.update({
    where: { id },
    data: {
      ...(tipo !== undefined && { tipo }),
      ...(nombre !== undefined && { nombre }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(lineaCredito !== undefined && { lineaCredito }),
      ...(saldoUtilizado !== undefined && { saldoUtilizado }),
      ...(tasaInteresMensual !== undefined && { tasaInteresMensual }),
      ...(usuario !== undefined && { usuario }),
      ...(pagoMensual !== undefined && { pagoMensual }),
      ...(pagosRealizados !== undefined && { pagosRealizados }),
      ...(pagosCompletados !== undefined && { pagosCompletados }),
      ...(pagosTotales !== undefined && { pagosTotales }),
    },
  });
  res.json(credito);
});

async function recalcularCredito(id: string) {
  const sum = await prisma.gasto.aggregate({ where: { creditoId: id }, _sum: { monto: true } });
  return sum._sum.monto ?? 0;
}

router.post("/:id/recalcular", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const existing = await prisma.credito.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Crédito no encontrado" });
    return;
  }
  const total = await recalcularCredito(id);
  const credito = await prisma.credito.update({ where: { id }, data: { saldoUtilizado: total } });
  res.json(credito);
});

router.post("/recalcular-todos", async (_req: Request, res: Response) => {
  const creditos = await prisma.credito.findMany();
  const updated = [];
  for (const c of creditos) {
    const total = await recalcularCredito(c.id);
    const u = await prisma.credito.update({ where: { id: c.id }, data: { saldoUtilizado: total } });
    updated.push(u);
  }
  res.json({ updated: updated.length, creditos: updated });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.credito.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Crédito no encontrado" });
    return;
  }

  await prisma.credito.delete({ where: { id } });
  res.json({ message: "Crédito eliminado" });
});

export default router;