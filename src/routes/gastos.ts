import { Router, Request, Response } from "express";
import prisma from "../db";

const router: Router = Router({ mergeParams: true });

async function recalcularSaldo(creditoId: string) {
  const sum = await prisma.gasto.aggregate({ where: { creditoId }, _sum: { monto: true } });
  const total = sum._sum.monto ?? 0;
  await prisma.credito.update({ where: { id: creditoId }, data: { saldoUtilizado: total } });
  return total;
}

async function validarLinea(creditoId: string, montoNuevo: number, montoAnterior: number | null, creditoIdAnterior: string | null) {
  // Saldo proyectado si se aplica el cambio, sin borrar datos
  if (creditoIdAnterior && creditoIdAnterior !== creditoId) {
    // Cambio de tarjeta: validar destino
    const credito = await prisma.credito.findUnique({ where: { id: creditoId } });
    if (!credito) throw Object.assign(new Error("Crédito no encontrado"), { status: 404 });
    const sumDest = await prisma.gasto.aggregate({ where: { creditoId }, _sum: { monto: true } });
    const proyectado = (sumDest._sum.monto ?? 0) + montoNuevo;
    if (proyectado > credito.lineaCredito) {
      const err = new Error(`Saldo proyectado ${proyectado.toFixed(2)} supera línea ${credito.lineaCredito.toFixed(2)} de ${credito.nombre}`) as Error & { status?: number };
      err.status = 400;
      throw err;
    }
  } else {
    const credito = await prisma.credito.findUnique({ where: { id: creditoId } });
    if (!credito) throw Object.assign(new Error("Crédito no encontrado"), { status: 404 });
    const sum = await prisma.gasto.aggregate({ where: { creditoId }, _sum: { monto: true } });
    const current = sum._sum.monto ?? 0;
    const base = montoAnterior !== null && creditoIdAnterior === creditoId ? current - montoAnterior : current;
    const proyectado = base + montoNuevo;
    if (proyectado > credito.lineaCredito) {
      const err = new Error(`Saldo proyectado ${proyectado.toFixed(2)} supera línea ${credito.lineaCredito.toFixed(2)} de ${credito.nombre}`) as Error & { status?: number };
      err.status = 400;
      throw err;
    }
  }
}

router.get("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const gastos = await prisma.gasto.findMany({ where: { monthId }, include: { credito: true } });
  res.json(gastos);
});

router.post("/", async (req: Request, res: Response) => {
  const monthId = req.params.monthId as string;
  const { concepto, monto, categoria, fin, metodoPago, creditoId } = req.body;

  const month = await prisma.month.findUnique({ where: { id: monthId } });
  if (!month) {
    res.status(404).json({ error: "Mes no encontrado" });
    return;
  }

  const mp = metodoPago === "credito" ? "credito" : "efectivo";
  let cid: string | null = null;
  if (mp === "credito") {
    if (!creditoId) {
      res.status(400).json({ error: "creditoId requerido cuando metodoPago es credito" });
      return;
    }
    cid = creditoId;
    const montoNum = typeof monto === "number" ? monto : parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      res.status(400).json({ error: "Monto inválido" });
      return;
    }
    try {
      await validarLinea(cid as string, montoNum, null, null);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      res.status(e.status ?? 500).json({ error: e.message });
      return;
    }
  }

  const gasto = await prisma.gasto.create({
    data: { monthId, concepto, monto, categoria, fin, metodoPago: mp, creditoId: cid },
    include: { credito: true },
  });

  if (cid) {
    await recalcularSaldo(cid);
    const actualizado = await prisma.gasto.findUnique({ where: { id: gasto.id }, include: { credito: true } });
    res.status(201).json(actualizado);
    return;
  }
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

  const { concepto, monto, categoria, fin, metodoPago, creditoId } = req.body;
  const mp = metodoPago !== undefined ? (metodoPago === "credito" ? "credito" : "efectivo") : existing.metodoPago;
  let cid: string | null | undefined = undefined;
  if (metodoPago !== undefined) {
    if (mp === "credito") {
      if (!creditoId) {
        res.status(400).json({ error: "creditoId requerido cuando metodoPago es credito" });
        return;
      }
      cid = creditoId;
    } else {
      cid = null;
    }
  } else if (creditoId !== undefined) {
    // metodoPago no cambia pero creditoId sí (solo si ya era credito)
    if (existing.metodoPago === "credito") {
      if (!creditoId) {
        res.status(400).json({ error: "creditoId requerido" });
        return;
      }
      mp as string;
      cid = creditoId;
    }
  }

  const montoNuevo = monto !== undefined ? (typeof monto === "number" ? monto : parseFloat(monto)) : existing.monto;
  const creditoDestino = (cid !== undefined ? cid : existing.creditoId) as string | null;
  const metodoDestino = metodoPago !== undefined ? mp : (existing.metodoPago as string);

  if (metodoDestino === "credito" && creditoDestino) {
    try {
      await validarLinea(creditoDestino as string, montoNuevo, existing.monto, existing.creditoId);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      res.status(e.status ?? 500).json({ error: e.message });
      return;
    }
  }

  const oldCreditoId = existing.creditoId;

  const gasto = await prisma.gasto.update({
    where: { id: gastoId },
    data: {
      ...(concepto !== undefined && { concepto }),
      ...(monto !== undefined && { monto }),
      ...(categoria !== undefined && { categoria }),
      ...(fin !== undefined && { fin }),
      ...(metodoPago !== undefined && { metodoPago: mp }),
      ...(cid !== undefined && { creditoId: cid }),
      ...(creditoId !== undefined && metodoPago === undefined && existing.metodoPago === "credito" && { creditoId }),
    },
    include: { credito: true },
  });

  // Recalcular saldos afectados (sin borrar datos, solo ajustar saldo)
  const toRecalc = new Set<string>();
  if (oldCreditoId) toRecalc.add(oldCreditoId);
  if (gasto.creditoId) toRecalc.add(gasto.creditoId);
  for (const id of toRecalc) await recalcularSaldo(id);

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

  if (existing.creditoId) {
    await recalcularSaldo(existing.creditoId);
  }

  // Si el concepto tiene un gasto indefinido en otro mes, crear exclusión
  // para evitar que se re-materialice en este mes
  const otroIndefinido = await prisma.gasto.findFirst({
    where: {
      concepto: existing.concepto,
      fin: "indefinido",
      NOT: { id: gastoId },
    },
  });
  if (otroIndefinido) {
    const exclExistente = await prisma.gastoExclusion.findFirst({
      where: { monthId, concepto: existing.concepto },
    });
    if (!exclExistente) {
      await prisma.gastoExclusion.create({
        data: { monthId, concepto: existing.concepto },
      });
    }
  }

  res.json({ message: "Gasto eliminado" });
});

export default router;
