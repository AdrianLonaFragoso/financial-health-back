import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CREDITOS_SEED = [
  { tipo: "tarjeta", nombre: "Banamex Costco", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Logo_de_Banamex.svg", lineaCredito: 97500, saldoUtilizado: 36164.79, tasaInteresMensual: 6.53, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "HSBC Zero", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg", lineaCredito: 120000, saldoUtilizado: 0, tasaInteresMensual: 7.71, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "Liverpool Grey", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/35/Liverpool_logo.svg", lineaCredito: 6000, saldoUtilizado: 0, tasaInteresMensual: 5.94, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "Rappi", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/06/Rappi_logo.svg", lineaCredito: 78000, saldoUtilizado: 19392.55, tasaInteresMensual: 5.38, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "American Express", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg", lineaCredito: 268000, saldoUtilizado: 10737.06, tasaInteresMensual: 7.44, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "NU", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg", lineaCredito: 50000, saldoUtilizado: 0, tasaInteresMensual: 8.04, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "BBVA", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/98/BBVA_logo_2025.svg", lineaCredito: 180000, saldoUtilizado: 8371.56, tasaInteresMensual: 6.21, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "Liverpool Rosa", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/35/Liverpool_logo.svg", lineaCredito: 20000, saldoUtilizado: 1877.30, tasaInteresMensual: 5.18, usuario: "Adrian" },
  { tipo: "tarjeta", nombre: "Plata", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Plata_Card_Logo.png", lineaCredito: 20000, saldoUtilizado: 1656.08, tasaInteresMensual: 9.02, usuario: "Adrian" },
];

const SEED_DATA = [
  {
    label: "Junio 2026",
    year: 2026,
    month: 6,
    ingresos: [
      { concepto: "Sueldo", monto: 49057.2 },
      { concepto: "Vales", monto: 3450 },
      { concepto: "Intereses", monto: 300 },
    ],
    gastos: [
      { concepto: "Renta + Mantenimiento", monto: 16287, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Limpieza", monto: 2000, categoria: "Necesidades", fin: "01-may-29" },
      { concepto: "Plan ATT", monto: 1625, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Internet", monto: 880, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Agua", monto: 605, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Jimena", monto: 4000, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Medica sur", monto: 1267, categoria: "Necesidades", fin: "01-ago-26" },
      { concepto: "Tenencias", monto: 127, categoria: "Necesidades", fin: "01-sep-27" },
      { concepto: "Youtube", monto: 319, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Netflix", monto: 348, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Spotify", monto: 149, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Crunchy roll", monto: 149, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Prime", monto: 99, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Raize + GNP", monto: 8054, categoria: "Estilo de vida", fin: "16-jun-26" },
      { concepto: "Retroid Pocket 5", monto: 452, categoria: "Estilo de vida", fin: "01-jul-26" },
      { concepto: "Casa Verde", monto: 6165.15, categoria: "Estilo de vida", fin: "01-jun-26" },
      { concepto: "ByeByeBelly", monto: 1902, categoria: "Estilo de vida", fin: "01-ago-26" },
      { concepto: "Ipad", monto: 889, categoria: "Estilo de vida", fin: "01-sep-27" },
      { concepto: "Apple Pencil", monto: 215, categoria: "Estilo de vida", fin: "01-feb-27" },
      { concepto: "Relojes Cubot", monto: 462, categoria: "Estilo de vida", fin: "01-jul-26" },
      { concepto: "Juegos Steam", monto: 902.48, categoria: "Estilo de vida", fin: "01-jul-26" },
      { concepto: "Ahorro", monto: 1000, categoria: "Ahorro", fin: "indefinido" },
      { concepto: "YTP", monto: 8560.84, categoria: "Deuda", fin: "01-dic-26" },
      { concepto: "Banamex Diferido", monto: 470.79, categoria: "Deuda", fin: "01-oct-27" },
      { concepto: "Diferido Rappi", monto: 475, categoria: "Deuda", fin: "01-jul-26" },
    ],
  },
  {
    label: "Julio 2026",
    year: 2026,
    month: 7,
    ingresos: [
      { concepto: "Sueldo", monto: 49057.2 },
      { concepto: "Vales", monto: 3450 },
      { concepto: "Intereses", monto: 300 },
      { concepto: "Fondo de ahorro", monto: 112000 },
    ],
    gastos: [
      { concepto: "Renta + Mantenimiento", monto: 16287, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Limpieza", monto: 2000, categoria: "Necesidades", fin: "01-may-29" },
      { concepto: "Plan ATT", monto: 1625, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Internet", monto: 880, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Agua", monto: 605, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Jimena", monto: 4000, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Medica sur", monto: 1267, categoria: "Necesidades", fin: "01-ago-26" },
      { concepto: "Tenencias", monto: 127, categoria: "Necesidades", fin: "01-sep-27" },
      { concepto: "Youtube", monto: 319, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Netflix", monto: 348, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Spotify", monto: 149, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Crunchy roll", monto: 149, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Prime", monto: 99, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Retroid Pocket", monto: 452, categoria: "Estilo de vida", fin: "01-jul-26" },
      { concepto: "ByeByeBelly", monto: 1902, categoria: "Estilo de vida", fin: "01-ago-26" },
      { concepto: "Ipad", monto: 889, categoria: "Estilo de vida", fin: "01-sep-27" },
      { concepto: "Apple Pencil", monto: 215, categoria: "Estilo de vida", fin: "01-feb-27" },
      { concepto: "Relojes Cubot", monto: 462, categoria: "Estilo de vida", fin: "01-jul-26" },
      { concepto: "Juegos Steam", monto: 902.48, categoria: "Estilo de vida", fin: "01-jul-26" },
      { concepto: "Ahorro", monto: 1000, categoria: "Ahorro", fin: "indefinido" },
      { concepto: "YTP", monto: 8560.84, categoria: "Deuda", fin: "01-dic-26" },
      { concepto: "Banamex Diferido", monto: 470.79, categoria: "Deuda", fin: "01-oct-27" },
      { concepto: "Diferido Rappi", monto: 475, categoria: "Deuda", fin: "01-jul-26" },
    ],
  },
  {
    label: "Agosto 2026",
    year: 2026,
    month: 8,
    ingresos: [
      { concepto: "Sueldo", monto: 49057.2 },
      { concepto: "Vales", monto: 3450 },
      { concepto: "Intereses", monto: 300 },
    ],
    gastos: [
      { concepto: "Renta + Mantenimiento", monto: 16287, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Limpieza", monto: 2000, categoria: "Necesidades", fin: "01-may-29" },
      { concepto: "Plan ATT", monto: 1625, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Internet", monto: 880, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Agua", monto: 605, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Jimena", monto: 4000, categoria: "Necesidades", fin: "indefinido" },
      { concepto: "Medica sur", monto: 1267, categoria: "Necesidades", fin: "01-ago-26" },
      { concepto: "Tenencias", monto: 127, categoria: "Necesidades", fin: "01-sep-27" },
      { concepto: "Youtube", monto: 319, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Netflix", monto: 348, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Spotify", monto: 149, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Crunchy roll", monto: 149, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "Prime", monto: 99, categoria: "Estilo de vida", fin: "indefinido" },
      { concepto: "ByeByeBelly", monto: 1902, categoria: "Estilo de vida", fin: "01-ago-26" },
      { concepto: "Ipad", monto: 889, categoria: "Estilo de vida", fin: "01-sep-27" },
      { concepto: "Apple Pencil", monto: 215, categoria: "Estilo de vida", fin: "01-feb-27" },
      { concepto: "Ahorro", monto: 1000, categoria: "Ahorro", fin: "indefinido" },
      { concepto: "YTP", monto: 8560.84, categoria: "Deuda", fin: "01-dic-26" },
      { concepto: "Banamex Diferido", monto: 470.79, categoria: "Deuda", fin: "01-oct-27" },
    ],
  },
];

async function main() {
  for (const data of SEED_DATA) {
    await prisma.month.create({
      data: {
        label: data.label,
        year: data.year,
        month: data.month,
        ingresos: { create: data.ingresos },
        gastos: { create: data.gastos },
      },
    });
  }
  console.log("Seed: 3 meses insertados");

  for (const data of CREDITOS_SEED) {
    await prisma.credito.create({ data });
  }
  console.log(`Seed: ${CREDITOS_SEED.length} créditos insertados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
