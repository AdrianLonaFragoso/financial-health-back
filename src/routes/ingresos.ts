import { Router, Request, Response } from "express";
import prisma from "../db";

const router: Router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const ingresos = await prisma.ingreso.findMany({ where: { monthId } });
  res.json(ingresos);
});

router.post("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const { concepto, monto } = req.body;

  const month = await prisma.month.findUnique({ where: { id: monthId } });
  if (!month) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }

  const ingreso = await prisma.ingreso.create({
    data: { monthId, concepto, monto },
  });
  res.status(201).json(ingreso);
});

router.put("/:ingresoId", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const ingresoId = req.params.ingresoId as string;

  const existing = await prisma.ingreso.findUnique({ where: { id: ingresoId } });
  if (!existing || existing.monthId !== monthId) {
    res.status(404).json({ error: "Ingreso no encontrado" });
    return;
  }

  const { concepto, monto } = req.body;
  const ingreso = await prisma.ingreso.update({
    where: { id: ingresoId },
    data: {
      ...(concepto !== undefined && { concepto }),
      ...(monto !== undefined && { monto }),
    },
  });
  res.json(ingreso);
});

router.delete("/:ingresoId", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const ingresoId = req.params.ingresoId as string;

  const existing = await prisma.ingreso.findUnique({ where: { id: ingresoId } });
  if (!existing || existing.monthId !== monthId) {
    res.status(404).json({ error: "Ingreso no encontrado" });
    return;
  }

  await prisma.ingreso.delete({ where: { id: ingresoId } });
  res.json({ message: "Ingreso eliminado" });
});

export default router;
