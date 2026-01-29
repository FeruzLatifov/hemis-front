#!/usr/bin/env node
/**
 * Sync Translations Script
 *
 * Downloads translations from backend API and saves them as JSON files
 * Run: node scripts/sync-translations.js
 *
 * Environment variables:
 *   VITE_API_URL - Backend API URL (default: http://localhost:8081)
 *   TRANSLATION_API_TOKEN - Optional auth token for API
 *   SKIP_TRANSLATION_SYNC - Set to 'true' to skip sync (useful for offline dev)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:8081';
const SKIP_SYNC = process.env.SKIP_TRANSLATION_SYNC === 'true';
const OUTPUT_DIR = path.join(__dirname, '../src/i18n/translations');
const LANGUAGES = ['uz', 'oz', 'ru', 'en'];

// Language code mapping (frontend -> backend)
const LANG_MAP = {
  uz: 'uz-UZ',
  oz: 'oz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

/**
 * Fetch translations from API
 */
async function fetchTranslations(lang) {
  const backendLang = LANG_MAP[lang] || lang;
  const url = `${API_URL}/api/v1/web/i18n/messages?lang=${backendLang}`;

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON response for ${lang}`));
          }
        } else if (res.statusCode === 401) {
          // Auth required - skip and use existing files
          console.warn(`  [WARN] Auth required for ${lang}, using existing file`);
          resolve(null);
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${lang}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${lang}`));
    });
  });
}

/**
 * Save translations to JSON file
 * Only overwrites if new data has content
 */
function saveTranslations(lang, translations) {
  const filePath = path.join(OUTPUT_DIR, `${lang}.json`);

  // Safety check: don't overwrite with empty data
  if (!translations || Object.keys(translations).length === 0) {
    console.warn(`  [SKIP] ${lang}.json - empty data, keeping existing file`);
    return false;
  }

  // Check if file exists
  const existingFile = fs.existsSync(filePath);

  const content = JSON.stringify(translations, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');

  const action = existingFile ? 'updated' : 'created';
  console.log(`  [OK] ${lang}.json ${action} (${Object.keys(translations).length} keys)`);
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('\n=== Translation Sync ===\n');

  // Check skip flag
  if (SKIP_SYNC) {
    console.log('[SKIP] SKIP_TRANSLATION_SYNC=true, using existing files\n');
    return;
  }

  console.log(`API: ${API_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const lang of LANGUAGES) {
    const filePath = path.join(OUTPUT_DIR, `${lang}.json`);
    const hasExisting = fs.existsSync(filePath);

    try {
      console.log(`Fetching ${lang}...`);
      const translations = await fetchTranslations(lang);

      if (translations) {
        const saved = saveTranslations(lang, translations);
        if (saved) {
          successCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
        if (hasExisting) {
          console.log(`  [KEEP] ${lang}.json - using existing file`);
        }
      }
    } catch (error) {
      failCount++;
      if (hasExisting) {
        console.warn(`  [KEEP] ${lang}.json - API error, using existing file`);
        console.warn(`         Error: ${error.message}`);
      } else {
        console.error(`  [MISS] ${lang}.json - no existing file and API failed!`);
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${successCount}/${LANGUAGES.length}`);
  if (skippedCount > 0) {
    console.log(`Skipped: ${skippedCount}/${LANGUAGES.length} (kept existing)`);
  }
  if (failCount > 0) {
    console.log(`Failed:  ${failCount}/${LANGUAGES.length} (kept existing)`);
  }
  console.log('');
}

// Run
main().catch((err) => {
  console.error('Translation sync failed:', err.message);
  // Don't exit with error - allow build to continue with existing files
  process.exit(0);
});
