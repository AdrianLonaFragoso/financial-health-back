-- Safe additive migration: link Gasto to Credito and add metodoPago. No data deletion.
-- Existing Gasto rows will get metodoPago='efectivo' and credito_id=NULL.
ALTER TABLE "Gasto" ADD COLUMN IF NOT EXISTS "metodo_pago" TEXT NOT NULL DEFAULT 'efectivo';
ALTER TABLE "Gasto" ADD COLUMN IF NOT EXISTS "credito_id" TEXT;
CREATE INDEX IF NOT EXISTS "Gasto_creditoId_idx" ON "Gasto"("credito_id");
-- Remove default after adding (keep default for future inserts via Prisma)
-- Foreign key with SET NULL on delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Gasto_credito_id_fkey') THEN
    ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "Credito"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
