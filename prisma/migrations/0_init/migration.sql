-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "test_jobs" (
    "id" SERIAL NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_jobs_pkey" PRIMARY KEY ("id")
);

