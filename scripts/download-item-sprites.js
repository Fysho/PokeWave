#!/usr/bin/env node

/**
 * Pokemon Item Sprite Downloader
 * Downloads all item sprites from PokeAPI's GitHub repository
 * and saves them locally to frontend/public/sprites/items/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'public', 'sprites', 'items');
const ITEMS_FILE = path.join(__dirname, '..', 'backend', 'data', 'pokemon-items.json');
const CONCURRENT_DOWNLOADS = 10;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Stats tracking
const stats = {
  downloaded: 0,
  skipped: 0,
  failed: 0,
  total: 0,
};

/**
 * Create directory if it doesn't exist
 */
function ensureDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
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
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath); // Remove empty file
        stats.skipped++;
        resolve('not_found');
      } else if (retries > 0) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        setTimeout(() => {
          downloadFile(url, destPath, retries - 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
      } else {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
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
 * Extract item names from the items JSON file
 */
function getItemNames() {
  if (!fs.existsSync(ITEMS_FILE)) {
    console.error(`Items file not found: ${ITEMS_FILE}`);
    console.log('Please run the backend server first to generate the items file.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf-8'));
  return data.items.map(item => item.name);
}

/**
 * Download sprite for a single item
 */
async function downloadItemSprite(itemName) {
  const url = `${BASE_URL}/${itemName}.png`;
  const destPath = path.join(OUTPUT_DIR, `${itemName}.png`);

  try {
    const result = await downloadFile(url, destPath);
    return { itemName, result };
  } catch (error) {
    console.error(`Failed to download sprite for ${itemName}: ${error.message}`);
    return { itemName, result: 'error' };
  }
}

/**
 * Process downloads in batches
 */
async function downloadAllSprites() {
  console.log('🎮 Pokemon Item Sprite Downloader');
  console.log('==================================');

  // Create directory
  ensureDirectory();

  // Get item names from JSON
  const itemNames = getItemNames();
  console.log(`Found ${itemNames.length} items to download`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Concurrent downloads: ${CONCURRENT_DOWNLOADS}`);
  console.log('');

  stats.total = itemNames.length;

  // Process in batches
  const startTime = Date.now();

  for (let i = 0; i < itemNames.length; i += CONCURRENT_DOWNLOADS) {
    const batch = itemNames.slice(i, i + CONCURRENT_DOWNLOADS);

    await Promise.all(batch.map(name => downloadItemSprite(name)));

    // Progress update
    const progress = Math.min(i + CONCURRENT_DOWNLOADS, itemNames.length);
    const percentage = ((progress / itemNames.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    process.stdout.write(`\rProgress: ${progress}/${itemNames.length} items (${percentage}%) - ${elapsed}s elapsed`);
  }

  console.log('\n');
  console.log('==================================');
  console.log('Download Complete!');
  console.log(`✅ Downloaded: ${stats.downloaded}`);
  console.log(`⏭️  Skipped (already exists or not found): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📊 Total processed: ${stats.downloaded + stats.skipped + stats.failed}`);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`⏱️  Total time: ${totalTime}s`);
}

// Run the script
downloadAllSprites().catch(console.error);
