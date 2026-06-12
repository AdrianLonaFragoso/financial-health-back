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
  const { tipo, nombre, logoUrl, lineaCredito, saldoUtilizado, tasaInteresMensual, usuario } = req.body;

  const credito = await prisma.credito.create({
    data: {
      tipo,
      nombre,
      logoUrl,
      lineaCredito,
      saldoUtilizado,
      tasaInteresMensual,
      usuario,
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

  const { tipo, nombre, logoUrl, lineaCredito, saldoUtilizado, tasaInteresMensual, usuario } = req.body;
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
    },
  });
  res.json(credito);
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