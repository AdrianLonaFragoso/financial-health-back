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
  const ingreso = await prisma.ingreso.create({
    data: { concepto, monto, monthId },
  });
  res.status(201).json(ingreso);
});

router.put("/:ingresoId", async (req: Request, res: Response) => {
  const ingresoId = req.params.ingresoId as string;
  const { concepto, monto } = req.body;
  const ingreso = await prisma.ingreso.update({
    where: { id: ingresoId },
    data: { concepto, monto },
  });
  res.json(ingreso);
});

router.delete("/:ingresoId", async (req: Request, res: Response) => {
  const ingresoId = req.params.ingresoId as string;
  await prisma.ingreso.delete({ where: { id: ingresoId } });
  res.status(204).end();
});

export default router;
