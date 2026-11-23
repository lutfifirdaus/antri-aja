-- CreateTable
CREATE TABLE "pin_attempts" (
    "id" UUID NOT NULL,
    "station_key" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pin_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pin_attempts_station_key_ip_created_at_idx" ON "pin_attempts"("station_key", "ip", "created_at");

-- CreateIndex
CREATE INDEX "pin_attempts_station_key_created_at_idx" ON "pin_attempts"("station_key", "created_at");

-- CreateIndex
CREATE INDEX "pin_attempts_ip_created_at_idx" ON "pin_attempts"("ip", "created_at");
