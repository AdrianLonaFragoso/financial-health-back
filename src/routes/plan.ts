import { Router, Request, Response } from "express";
import prisma from "../db";

const router: Router = Router();

const DEFAULT_PLAN = { necesidades: 50, estiloVida: 30, ahorro: 20 };

router.get("/", async (_req: Request, res: Response) => {
  const plan = await prisma.planConfig.findFirst();
  if (!plan) {
    res.json(DEFAULT_PLAN);
    return;
  }
  res.json({
    necesidades: plan.necesidades,
    estiloVida: plan.estiloVida,
    ahorro: plan.ahorro,
  });
});

router.put("/", async (req: Request, res: Response) => {
  const { necesidades, estiloVida, ahorro } = req.body;

  if (
    typeof necesidades !== "number" ||
    typeof estiloVida !== "number" ||
    typeof ahorro !== "number" ||
    !Number.isFinite(necesidades) ||
    !Number.isFinite(estiloVida) ||
    !Number.isFinite(ahorro) ||
    necesidades < 0 ||
    estiloVida < 0 ||
    ahorro < 0 ||
    Math.round((necesidades + estiloVida + ahorro) * 100) / 100 !== 100
  ) {
    res.status(400).json({ error: "Los porcentajes deben sumar 100" });
    return;
  }

  const plan = await prisma.planConfig.upsert({
    where: { id: 1 },
    update: { necesidades, estiloVida, ahorro },
    create: { id: 1, necesidades, estiloVida, ahorro },
  });

  res.json({
    necesidades: plan.necesidades,
    estiloVida: plan.estiloVida,
    ahorro: plan.ahorro,
  });
});

export default router;
