-- CreateTable
CREATE TABLE "OnlineElo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "rank" TEXT NOT NULL DEFAULT 'bronze',
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "highestElo" INTEGER NOT NULL DEFAULT 1000,
    "lowestElo" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineElo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineRound" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "pokemon1Data" JSONB NOT NULL,
    "pokemon2Data" JSONB NOT NULL,
    "actualWinPercent" DOUBLE PRECISION NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlineRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineGuess" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guess" DOUBLE PRECISION NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accuracyScore" DOUBLE PRECISION,
    "rankPosition" INTEGER,
    "eloChange" INTEGER,
    "eloBefore" INTEGER,
    "eloAfter" INTEGER,

    CONSTRAINT "OnlineGuess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlinePresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socketId" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentRound" INTEGER,
    "hasSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlinePresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineElo_userId_key" ON "OnlineElo"("userId");

-- CreateIndex
CREATE INDEX "OnlineElo_elo_idx" ON "OnlineElo"("elo" DESC);

-- CreateIndex
CREATE INDEX "OnlineElo_rank_idx" ON "OnlineElo"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineRound_roundNumber_key" ON "OnlineRound"("roundNumber");

-- CreateIndex
CREATE INDEX "OnlineRound_roundNumber_idx" ON "OnlineRound"("roundNumber");

-- CreateIndex
CREATE INDEX "OnlineRound_startTime_idx" ON "OnlineRound"("startTime");

-- CreateIndex
CREATE INDEX "OnlineGuess_roundId_idx" ON "OnlineGuess"("roundId");

-- CreateIndex
CREATE INDEX "OnlineGuess_userId_idx" ON "OnlineGuess"("userId");

-- CreateIndex
CREATE INDEX "OnlineGuess_submittedAt_idx" ON "OnlineGuess"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineGuess_roundId_userId_key" ON "OnlineGuess"("roundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OnlinePresence_userId_key" ON "OnlinePresence"("userId");

-- CreateIndex
CREATE INDEX "OnlinePresence_lastSeen_idx" ON "OnlinePresence"("lastSeen");

-- AddForeignKey
ALTER TABLE "OnlineElo" ADD CONSTRAINT "OnlineElo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineGuess" ADD CONSTRAINT "OnlineGuess_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "OnlineRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
