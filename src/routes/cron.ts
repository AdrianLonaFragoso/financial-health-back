import { Router, Request, Response } from "express";
import { ensureCurrentMonth } from "./meses";

const router: Router = Router();

// Vercel Cron will hit this endpoint on the 1st of each month at 06:00 UTC (00:00 America/Mexico_City)
// Also usable as manual trigger. No data is ever deleted, only created if missing (idempotent).
router.get("/ensure-month", async (req: Request, res: Response) => {
  // Optional auth: if CRON_SECRET is set, require it (Vercel, manual). Allows unauthenticated fallback for lazy ensure.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization;
    const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : (req.query.secret as string | undefined);
    const vercelCron = req.headers["x-vercel-cron"] === "1";
    if (!vercelCron && provided !== secret) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
  }

  try {
    const result = await ensureCurrentMonth();
    res.json({
      ok: true,
      created: result.created,
      month: result.month,
      message: result.created ? "Nuevo corte mensual creado (ingresos copiados, gastos fijos/vigentes copiados, sin borrar histórico)" : "Corte ya existía, sin cambios",
    });
  } catch (err) {
    console.error("[cron/ensure-month] error", err);
    res.status(500).json({ error: "Error al asegurar corte mensual", details: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/ensure-month", async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization;
    const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : (req.body?.secret as string | undefined);
    const vercelCron = req.headers["x-vercel-cron"] === "1";
    if (!vercelCron && provided !== secret) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
  }
  try {
    const result = await ensureCurrentMonth();
    res.json({
      ok: true,
      created: result.created,
      month: result.month,
      message: result.created ? "Nuevo corte mensual creado" : "Corte ya existía",
    });
  } catch (err) {
    console.error("[cron/ensure-month] error", err);
    res.status(500).json({ error: "Error al asegurar corte mensual", details: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
