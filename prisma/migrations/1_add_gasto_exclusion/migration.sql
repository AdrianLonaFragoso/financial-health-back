-- CreateTable
CREATE TABLE "gasto_exclusiones" (
    "id" TEXT NOT NULL,
    "month_id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,

    CONSTRAINT "gasto_exclusiones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gasto_exclusiones" ADD CONSTRAINT "gasto_exclusiones_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "Month"("id") ON DELETE CASCADE ON UPDATE CASCADE;
