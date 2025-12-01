-- AlterTable
ALTER TABLE "OnlinePresence" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'spectating';

-- CreateTable
CREATE TABLE "OnlineGameState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "roundStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineGameState_pkey" PRIMARY KEY ("id")
);
