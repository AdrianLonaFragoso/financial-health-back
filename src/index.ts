import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import prisma from "./db";
import mesesRouter from "./routes/meses";
import gastosRouter from "./routes/gastos";
import ingresosRouter from "./routes/ingresos";
import exclusionesRouter from "./routes/exclusiones";
import creditosRouter from "./routes/creditos";
import planRouter from "./routes/plan";
import cronRouter from "./routes/cron";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/debug/migrate-status", async (_req, res) => {
  try {
    const [monthCols, gastoCols, migrations] = await Promise.all([
      prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='Gasto' AND column_name IN ('metodo_pago','credito_id') ORDER BY column_name") as Promise<{ column_name: string }[]>,
      prisma.$queryRawUnsafe("SELECT indexname FROM pg_indexes WHERE tablename='Month' AND indexname='Month_year_month_key'") as Promise<{ indexname: string }[]>,
      prisma.$queryRawUnsafe("SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5") as Promise<{ migration_name: string; finished_at: Date }[]>,
    ]);
    res.json({
      gastoColumns: monthCols.map((c) => c.column_name),
      monthUniqueIndex: gastoCols.length > 0 ? "present" : "missing",
      recentMigrations: migrations,
      autoRecalcularSaldos: "enabled",
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.use("/api/meses", mesesRouter);
app.use("/api/meses/:monthId/gastos", gastosRouter);
app.use("/api/meses/:monthId/ingresos", ingresosRouter);
app.use("/api/meses/:monthId/exclusiones", exclusionesRouter);
app.use("/api/creditos", creditosRouter);
app.use("/api/plan", planRouter);
app.use("/api/cron", cronRouter);

app.get("/api/resumen", async (_req, res, next) => {
  try {
    const meses = await prisma.month.findMany({
      include: { ingresos: true, gastos: true },
    });

    const totalIngresos = meses.reduce(
      (acc, m) => acc + m.ingresos.reduce((s, i) => s + i.monto, 0),
      0
    );
    const totalGastos = meses.reduce(
      (acc, m) => acc + m.gastos.reduce((s, g) => s + g.monto, 0),
      0
    );

    res.json({
      totalMeses: meses.length,
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
    });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

// Recalculo automático de saldos al arrancar (no borra gastos, solo sincroniza Credito.saldoUtilizado = SUM(Gasto:monto) por crédito)
async function autoRecalcularSaldos() {
  try {
    const creditos = await prisma.credito.findMany({ select: { id: true } });
    for (const c of creditos) {
      const sum = await prisma.gasto.aggregate({ where: { creditoId: c.id }, _sum: { monto: true } });
      const total = sum._sum.monto ?? 0;
      await prisma.credito.update({ where: { id: c.id }, data: { saldoUtilizado: total } });
    }
    if (creditos.length > 0) console.log(`[autoRecalcularSaldos] ${creditos.length} créditos sincronizados`);
  } catch (e) {
    console.warn("[autoRecalcularSaldos] omitido (tabla Gasto aún sin columna credito_id?)", e instanceof Error ? e.message : String(e));
  }
}
autoRecalcularSaldos();

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
