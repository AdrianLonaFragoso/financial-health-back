import { Router, Request, Response } from "express";
import prisma from "../db";

const router: Router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const gastos = await prisma.gasto.findMany({ where: { monthId } });
  res.json(gastos);
});

router.post("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const { concepto, monto, categoria, fin } = req.body;

  const month = await prisma.month.findUnique({ where: { id: monthId } });
  if (!month) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }

  const gasto = await prisma.gasto.create({
    data: { monthId, concepto, monto, categoria, fin },
  });
  res.status(201).json(gasto);
});

router.put("/:gastoId", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const gastoId = req.params.gastoId as string;

  const existing = await prisma.gasto.findUnique({ where: { id: gastoId } });
  if (!existing || existing.monthId !== monthId) {
    res.status(404).json({ error: "Gasto no encontrado" });
    return;
  }

  const { concepto, monto, categoria, fin } = req.body;
  const gasto = await prisma.gasto.update({
    where: { id: gastoId },
    data: {
      ...(concepto !== undefined && { concepto }),
      ...(monto !== undefined && { monto }),
      ...(categoria !== undefined && { categoria }),
      ...(fin !== undefined && { fin }),
    },
  });
  res.json(gasto);
});

router.delete("/:gastoId", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const gastoId = req.params.gastoId as string;

  const existing = await prisma.gasto.findUnique({ where: { id: gastoId } });
  if (!existing || existing.monthId !== monthId) {
    res.status(404).json({ error: "Gasto no encontrado" });
    return;
  }

  await prisma.gasto.delete({ where: { id: gastoId } });
  res.json({ message: "Gasto eliminado" });
});

export default router;
