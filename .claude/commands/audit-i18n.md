---
description: Audit entire frontend codebase for i18n compliance — hardcoded strings, missing keys, sync status
allowed-tools: Bash, Read, Grep, Glob
---

Run a comprehensive i18n audit of the HEMIS frontend.

## Workflow

### 1. Scan for hardcoded user-facing strings

```bash
cd /home/adm1n/projects/startup/hemis-front

# Cyrillic (Uzbek/Russian) text in JSX
echo "=== Cyrillic hardcoded text ==="
grep -rn ">[А-Яа-яЎўҚқҒғҲҳЁё]\\{2,\\}" --include="*.tsx" src/ \
    | grep -v "__tests__\|i18n/translations" \
    | head -30

# Latin Uzbek (apostrophe pattern: o', g')
echo "=== Latin Uzbek with apostrophe ==="
grep -rnE ">[A-Za-z]+'[a-z]" --include="*.tsx" src/ \
    | grep -v "{t(\|import\|comment" \
    | head -20

# Sentence-like English text NOT in t()
echo "=== Possible untranslated English ==="
grep -rnE ">([A-Z][a-z]+\\s){1,5}[a-z.!?]+<" --include="*.tsx" src/ \
    | grep -v "{t(\|aria-\|data-\|className=\|import" \
    | head -20
```

### 2. Translation key audit

```bash
# Extract all t() keys used in code
grep -rohE "t\\([\"']([^\"']+)[\"']" --include="*.tsx" --include="*.ts" src/ \
    | sed -E "s/t\\([\"']//; s/[\"']$//" \
    | sort -u > /tmp/used-keys.txt

# Get keys from en.json
jq -r 'keys[]' src/i18n/translations/en.json | sort > /tmp/json-keys.txt

# Used in code, missing in en.json
echo "=== Missing in en.json (used in code) ==="
comm -23 /tmp/used-keys.txt /tmp/json-keys.txt | head -30

# In en.json, not used in code
echo "=== Unused keys (could be removed) ==="
comm -13 /tmp/used-keys.txt /tmp/json-keys.txt | head -30

# Counts
echo ""
echo "Used keys: $(wc -l < /tmp/used-keys.txt)"
echo "JSON keys: $(wc -l < /tmp/json-keys.txt)"
```

### 3. Translation file sync status

```bash
echo "=== Translation file key counts ==="
for f in uz oz ru en; do
    count=$(jq 'length' src/i18n/translations/$f.json 2>/dev/null)
    echo "$f.json: $count keys"
done
```

If counts diverge significantly → run `yarn sync:translations`.

### 4. Static interpolation anti-pattern

```bash
echo "=== Static value in interpolation ==="
grep -rn "{t([^)]*{{[^}]*}}" --include="*.tsx" src/ \
    | grep -v "user\\.\\|count\\|total\\|name\\.\\|.length\\|.size" \
    | head -10
```

### 5. Hook context — `t()` outside component

```bash
echo "=== t() in onSuccess/onError (use i18n.t() instead) ==="
grep -rn "onSuccess.*toast.*t(\\|onError.*toast.*t(" --include="*.tsx" --include="*.ts" src/ \
    | head -10
```

### 6. Output report

```
=== i18n Audit Report ===
Date: <today>

🔴 BLOCKING:
  Cyrillic hardcoded:    X occurrences
  Latin Uzbek hardcoded: Y occurrences
  English not in t():    Z occurrences

🟡 SHOULD FIX:
  Missing keys in en.json:    A
  Unused keys in en.json:     B
  Static interpolations:      C

🟢 NICE-TO-HAVE:
  Long keys (>100 chars):     D
  Hook-context t() misuse:    E

Translation file sync:
  uz: X / en: Y / oz: Z / ru: W
  Status: <SYNCED | OUT_OF_SYNC>

Action items:
  1. Wrap hardcoded strings in t() (X total)
  2. Add missing keys to en.json + run yarn sync:translations
  3. Review unused keys (may indicate dead code)
  4. Replace static interpolations with full text

Estimated effort: ~<N> hours
```

## Constraints

- Don't flag aria-\* values or className strings as hardcoded text
- Don't flag test fixtures (`__tests__/`)
- Don't flag SVG content
- Don't recommend deleting unused keys without verification (might be loaded dynamically)
