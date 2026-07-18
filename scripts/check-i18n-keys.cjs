#!/usr/bin/env node
/**
 * i18n drift gate.
 *
 * Fails when a `t('...')` / `i18n.t('...')` literal key used in src/ is absent
 * from en.json — i.e. a string that would render untranslated for every locale.
 *
 * A baseline (scripts/i18n-known-missing.json) lists keys already known to be
 * missing and pending a hemis-back seed (see docs/i18n-missing-keys-*.md). The
 * gate only fails on NEW drift, so it can be wired into CI immediately without
 * blocking on the existing backlog. As the backend seeds keys and
 * `yarn sync:translations` pulls them in, prune them from the baseline.
 *
 * Usage: node scripts/check-i18n-keys.cjs
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const EN = path.join(SRC, 'i18n/translations/en.json')
const BASELINE = path.join(__dirname, 'i18n-known-missing.json')

const KEY_RE = /(?<![\w.])(?:i18n\.)?t\(\s*(['"])((?:\\.|(?!\1).)*?)\1/g

/** Recursively collect .ts/.tsx source files, skipping tests. */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue
      walk(full, acc)
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full)
    }
  }
  return acc
}

function extractKeys() {
  const keys = new Map() // key -> Set(relative file)
  for (const file of walk(SRC)) {
    const txt = fs.readFileSync(file, 'utf8')
    let m
    while ((m = KEY_RE.exec(txt))) {
      const key = m[2].replace(/\\"/g, '"').replace(/\\'/g, "'")
      if (!key.trim()) continue
      if (!keys.has(key)) keys.set(key, new Set())
      keys.get(key).add(path.relative(ROOT, file))
    }
  }
  return keys
}

const enKeys = new Set(Object.keys(JSON.parse(fs.readFileSync(EN, 'utf8'))))
const baseline = new Set(
  fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : [],
)

const used = extractKeys()
const newMissing = []
for (const [key, files] of used) {
  if (!enKeys.has(key) && !baseline.has(key)) {
    newMissing.push({ key, files: [...files] })
  }
}

// Report baseline keys that have since been seeded, so the baseline can shrink.
const seededFromBaseline = [...baseline].filter((k) => enKeys.has(k))

if (seededFromBaseline.length) {
  console.log(
    `ℹ ${seededFromBaseline.length} baseline key(s) now present in en.json — prune them from scripts/i18n-known-missing.json.`,
  )
}

if (newMissing.length) {
  console.error(`\n✗ ${newMissing.length} NEW i18n key(s) missing from en.json:\n`)
  for (const { key, files } of newMissing) {
    console.error(`  • ${JSON.stringify(key)}\n      ${files.join(', ')}`)
  }
  console.error(
    '\nSeed them in hemis-back (_seed_msg) + run `yarn sync:translations`, or add to the baseline if intentional.',
  )
  process.exit(1)
}

console.log(`✓ i18n gate passed — ${used.size} keys used, ${baseline.size} known-missing baselined.`)
