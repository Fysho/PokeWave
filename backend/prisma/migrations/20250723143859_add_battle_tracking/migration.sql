-- CreateTable
CREATE TABLE "PokemonInstance" (
    "id" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "types" TEXT[],
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "specialAttack" INTEGER NOT NULL,
    "specialDefense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "ability" TEXT NOT NULL,
    "abilityName" TEXT NOT NULL,
    "item" TEXT,
    "itemName" TEXT,
    "nature" TEXT NOT NULL,
    "moves" JSONB NOT NULL,
    "ivs" JSONB NOT NULL,
    "evs" JSONB NOT NULL,
    "sprite" TEXT NOT NULL,
    "spriteBack" TEXT,
    "isShiny" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "teraType" TEXT,
    "dynamaxLevel" INTEGER,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokemonInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "pokemon1Id" TEXT NOT NULL,
    "pokemon2Id" TEXT NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "totalBattles" INTEGER NOT NULL,
    "executionTime" INTEGER,
    "totalGuesses" INTEGER NOT NULL DEFAULT 0,
    "correctGuesses" INTEGER NOT NULL DEFAULT 0,
    "avgGuessPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PokemonInstance_pokemonId_idx" ON "PokemonInstance"("pokemonId");

-- CreateIndex
CREATE INDEX "PokemonInstance_createdAt_idx" ON "PokemonInstance"("createdAt");

-- CreateIndex
CREATE INDEX "Battle_pokemon1Id_pokemon2Id_idx" ON "Battle"("pokemon1Id", "pokemon2Id");

-- CreateIndex
CREATE INDEX "Battle_totalGuesses_idx" ON "Battle"("totalGuesses");

-- CreateIndex
CREATE UNIQUE INDEX "Battle_pokemon1Id_pokemon2Id_key" ON "Battle"("pokemon1Id", "pokemon2Id");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_pokemon1Id_fkey" FOREIGN KEY ("pokemon1Id") REFERENCES "PokemonInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_pokemon2Id_fkey" FOREIGN KEY ("pokemon2Id") REFERENCES "PokemonInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
