-- CreateEnum
CREATE TYPE "ActiveTimerStatus" AS ENUM ('RUNNING', 'PAUSED');

-- AlterTable
ALTER TABLE "ActiveTimer" ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ActiveTimerStatus" NOT NULL DEFAULT 'RUNNING';
