-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarPokemonId" INTEGER NOT NULL DEFAULT 25,
    "avatarSprite" TEXT NOT NULL DEFAULT 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pokedex" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unlockedPokemon" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "unlockedShinyPokemon" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "pokemonCounts" JSONB NOT NULL DEFAULT '{}',
    "shinyPokemonCounts" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pokedex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalBattles" INTEGER NOT NULL DEFAULT 0,
    "totalCorrectGuesses" INTEGER NOT NULL DEFAULT 0,
    "highestStreak" INTEGER NOT NULL DEFAULT 0,
    "endlessHighScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndlessScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EndlessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeDate" DATE NOT NULL,
    "score" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallengeScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Pokedex_userId_key" ON "Pokedex"("userId");

-- CreateIndex
CREATE INDEX "Pokedex_userId_idx" ON "Pokedex"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameStats_userId_key" ON "GameStats"("userId");

-- CreateIndex
CREATE INDEX "GameStats_userId_idx" ON "GameStats"("userId");

-- CreateIndex
CREATE INDEX "EndlessScore_userId_idx" ON "EndlessScore"("userId");

-- CreateIndex
CREATE INDEX "EndlessScore_score_idx" ON "EndlessScore"("score" DESC);

-- CreateIndex
CREATE INDEX "DailyChallengeScore_userId_idx" ON "DailyChallengeScore"("userId");

-- CreateIndex
CREATE INDEX "DailyChallengeScore_challengeDate_idx" ON "DailyChallengeScore"("challengeDate");

-- CreateIndex
CREATE INDEX "DailyChallengeScore_score_idx" ON "DailyChallengeScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeScore_userId_challengeDate_key" ON "DailyChallengeScore"("userId", "challengeDate");

-- AddForeignKey
ALTER TABLE "Pokedex" ADD CONSTRAINT "Pokedex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameStats" ADD CONSTRAINT "GameStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndlessScore" ADD CONSTRAINT "EndlessScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeScore" ADD CONSTRAINT "DailyChallengeScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
