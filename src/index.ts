import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import prisma from "./db";
import mesesRouter from "./routes/meses";
import gastosRouter from "./routes/gastos";
import ingresosRouter from "./routes/ingresos";
import exclusionesRouter from "./routes/exclusiones";
import creditosRouter from "./routes/creditos";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/meses", mesesRouter);
app.use("/api/meses/:monthId/gastos", gastosRouter);
app.use("/api/meses/:monthId/ingresos", ingresosRouter);
app.use("/api/meses/:monthId/exclusiones", exclusionesRouter);
app.use("/api/creditos", creditosRouter);

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

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
