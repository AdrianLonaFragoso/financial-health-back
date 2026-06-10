import { Router, Request, Response } from "express";
import prisma from "../db";

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
      ingresos: {
        create: ingresos ?? [],
      },
      gastos: {
        create: gastos ?? [],
      },
    },
    include: { ingresos: true, gastos: true },
  });
  res.status(201).json(nuevo);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.month.delete({ where: { id } });
  res.status(204).end();
});

export default router;
