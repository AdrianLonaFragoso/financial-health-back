import { Router, Request, Response } from "express";
import prisma from "../db";

const router: Router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const exclusiones = await prisma.gastoExclusion.findMany({
    where: { monthId },
  });
  res.json(exclusiones);
});

router.post("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const { concepto } = req.body;

  if (!concepto) {
    res.status(400).json({ error: "Falta el campo concepto" });
    return;
  }

  const existente = await prisma.gastoExclusion.findFirst({
    where: { monthId, concepto },
  });
  if (existente) {
    res.json(existente);
    return;
  }

  const exclusion = await prisma.gastoExclusion.create({
    data: { monthId, concepto },
  });
  res.status(201).json(exclusion);
});

router.delete("/:exclusionId", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const exclusionId = req.params.exclusionId as string;

  const existing = await prisma.gastoExclusion.findUnique({
    where: { id: exclusionId },
  });
  if (!existing || existing.monthId !== monthId) {
    res.status(404).json({ error: "Exclusión no encontrada" });
    return;
  }

  await prisma.gastoExclusion.delete({ where: { id: exclusionId } });
  res.json({ message: "Exclusión eliminada" });
});

export default router;
