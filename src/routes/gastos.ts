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
  const gasto = await prisma.gasto.create({
    data: { concepto, monto, categoria, fin, monthId },
  });
  res.status(201).json(gasto);
});

router.put("/:gastoId", async (req: Request, res: Response) => {
  const gastoId = req.params.gastoId as string;
  const { concepto, monto, categoria, fin } = req.body;
  const gasto = await prisma.gasto.update({
    where: { id: gastoId },
    data: { concepto, monto, categoria, fin },
  });
  res.json(gasto);
});

router.delete("/:gastoId", async (req: Request, res: Response) => {
  const gastoId = req.params.gastoId as string;
  await prisma.gasto.delete({ where: { id: gastoId } });
  res.status(204).end();
});

export default router;
