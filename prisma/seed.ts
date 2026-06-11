import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
  console.log("Seed completado: 3 meses insertados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
