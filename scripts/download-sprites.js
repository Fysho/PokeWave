#!/usr/bin/env node

/**
 * Pokemon Sprite Downloader
 * Downloads all Pokemon sprites from PokeAPI's GitHub repository
 * and saves them locally to frontend/public/sprites/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'public', 'sprites');
const MAX_POKEMON_ID = 1025; // Up to Gen 9
const CONCURRENT_DOWNLOADS = 10; // Number of parallel downloads
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms

// Sprite types to download
const SPRITE_TYPES = [
  { name: 'front', urlSuffix: '' },
  { name: 'back', urlSuffix: '/back' },
  { name: 'shiny', urlSuffix: '/shiny' },
];

// Stats tracking
const stats = {
  downloaded: 0,
  skipped: 0,
  failed: 0,
  total: 0,
};

/**
 * Create directories if they don't exist
 */
function ensureDirectories() {
  for (const type of SPRITE_TYPES) {
    const dir = path.join(OUTPUT_DIR, type.name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

/**
 * Download a file with retry logic
 */
function downloadFile(url, destPath, retries = RETRY_ATTEMPTS) {
  return new Promise((resolve, reject) => {
    // Check if file already exists
    if (fs.existsSync(destPath)) {
      stats.skipped++;
      resolve('skipped');
      return;
    }

    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          stats.downloaded++;
          resolve('downloaded');
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlinkSync(destPath); // Remove empty file
        stats.skipped++;
        resolve('not_found');
      } else if (retries > 0) {
        file.close();
        fs.unlinkSync(destPath);
        setTimeout(() => {
          downloadFile(url, destPath, retries - 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
      } else {
        file.close();
        fs.unlinkSync(destPath);
        stats.failed++;
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      if (retries > 0) {
        setTimeout(() => {
          downloadFile(url, destPath, retries - 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
      } else {
        stats.failed++;
        reject(err);
      }
    });
  });
}

/**
 * Download sprites for a single Pokemon
 */
async function downloadPokemonSprites(pokemonId) {
  const results = [];

  for (const type of SPRITE_TYPES) {
    const url = `${BASE_URL}${type.urlSuffix}/${pokemonId}.png`;
    const destPath = path.join(OUTPUT_DIR, type.name, `${pokemonId}.png`);

    try {
      const result = await downloadFile(url, destPath);
      results.push({ type: type.name, pokemonId, result });
    } catch (error) {
      console.error(`Failed to download ${type.name} sprite for Pokemon #${pokemonId}: ${error.message}`);
      results.push({ type: type.name, pokemonId, result: 'error' });
    }
  }

  return results;
}

/**
 * Process downloads in batches
 */
async function downloadAllSprites() {
  console.log('🎮 Pokemon Sprite Downloader');
  console.log('============================');
  console.log(`Downloading sprites for Pokemon #1 to #${MAX_POKEMON_ID}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Concurrent downloads: ${CONCURRENT_DOWNLOADS}`);
  console.log('');

  // Create directories
  ensureDirectories();

  // Calculate total
  stats.total = MAX_POKEMON_ID * SPRITE_TYPES.length;

  // Create array of all Pokemon IDs
  const pokemonIds = Array.from({ length: MAX_POKEMON_ID }, (_, i) => i + 1);

  // Process in batches
  const startTime = Date.now();

  for (let i = 0; i < pokemonIds.length; i += CONCURRENT_DOWNLOADS) {
    const batch = pokemonIds.slice(i, i + CONCURRENT_DOWNLOADS);

    await Promise.all(batch.map(id => downloadPokemonSprites(id)));

    // Progress update
    const progress = Math.min(i + CONCURRENT_DOWNLOADS, pokemonIds.length);
    const percentage = ((progress / pokemonIds.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    process.stdout.write(`\rProgress: ${progress}/${pokemonIds.length} Pokemon (${percentage}%) - ${elapsed}s elapsed`);
  }

  console.log('\n');
  console.log('============================');
  console.log('Download Complete!');
  console.log(`✅ Downloaded: ${stats.downloaded}`);
  console.log(`⏭️  Skipped (already exists): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📊 Total processed: ${stats.downloaded + stats.skipped + stats.failed}`);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`⏱️  Total time: ${totalTime}s`);
}

// Run the script
downloadAllSprites().catch(console.error);
