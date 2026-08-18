-- CreateTable
CREATE TABLE "plan_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "necesidades" DOUBLE PRECISION NOT NULL,
    "estilo_vida" DOUBLE PRECISION NOT NULL,
    "ahorro" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_config_pkey" PRIMARY KEY ("id")
);
