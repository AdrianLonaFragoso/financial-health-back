-- Safe additive migration: ensure no data loss, only add unique constraint and index
-- Existing data: Junio, Julio, Agosto 2026 are distinct (year,month) so this will succeed.
-- If duplicates existed, this migration would fail without deleting anything.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Month_year_month_idx" ON "Month"("year", "month");

-- Create unique constraint (fails safely if duplicates, never deletes)
CREATE UNIQUE INDEX IF NOT EXISTS "Month_year_month_key" ON "Month"("year", "month");
