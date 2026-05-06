---
description: Run accessibility audit — ESLint jsx-a11y + manual checks for WCAG 2.1 AA compliance
allowed-tools: Bash, Read, Grep, Glob
---

Run a comprehensive accessibility audit.

## Workflow

### 1. ESLint jsx-a11y check

```bash
cd /home/adm1n/projects/startup/hemis-front
yarn lint 2>&1 | grep -i "a11y\|accessibility\|aria-\|alt-text" | head -50
```

### 2. Inputs without label

```bash
echo "=== Inputs without label ==="
grep -rn "<Input\|<input " --include="*.tsx" src/ \
    | grep -v "aria-label\|aria-labelledby\|<Label" \
    | head -20
```

For each, check:

- Is there a `<Label htmlFor="...">` in the same component?
- If not — flag.

### 3. Buttons without accessible name

```bash
echo "=== Possibly icon-only buttons without aria-label ==="
# Self-closing or empty buttons without aria-label
grep -rn -B1 -A2 "<Button\|<button" --include="*.tsx" src/ \
    | grep -E "(<Button|<button)[^>]*\\s*(/>|>\\s*<)" \
    | grep -v "aria-label\|aria-labelledby" \
    | head -10
```

### 4. Click handlers on non-interactive elements

```bash
echo "=== div/span with onClick (no role) ==="
grep -rn "<div[^>]*onClick\|<span[^>]*onClick\|<li[^>]*onClick" --include="*.tsx" src/ \
    | grep -v 'role="button"\|role="link"\|role="menuitem"' \
    | head -10
```

For each — should be `<button>` or have `role="button" tabIndex={0} onKeyDown={...}`.

### 5. Images without alt

```bash
echo "=== <img> without alt ==="
grep -rn "<img " --include="*.tsx" src/ | grep -v "alt=" | head -10
```

### 6. Heading structure check

```bash
echo "=== Pages with multiple h1 ==="
for f in $(find src/pages -name "*Page.tsx"); do
    count=$(grep -c "<h1" "$f" 2>/dev/null)
    if [ "$count" -gt 1 ]; then
        echo "$f: $count h1 tags"
    fi
done
```

### 7. Form errors not announced

```bash
echo "=== Form errors without aria-describedby ==="
# Look for error display next to input without proper association
grep -rn -B5 "errors\\.\\|formState.errors" --include="*.tsx" src/ \
    | grep -v "aria-invalid\|aria-describedby" \
    | head -20
```

### 8. Color-only signals (manual review hints)

```bash
echo "=== Status-only badges (need icon + text) ==="
grep -rn "Badge\\|badge" --include="*.tsx" src/ \
    | grep -E "bg-(red|green|yellow|blue|orange)" \
    | grep -v "{t(" | head -10
```

Status colors should accompany text or icon for color-blind users.

### 9. Skip link present?

```bash
echo "=== SkipLink usage ==="
grep -rn "SkipLink\|skip-link\|sr-only" --include="*.tsx" src/components src/App.tsx 2>/dev/null | head -5
```

### 10. Language attribute

```bash
echo "=== document.documentElement.lang sync ==="
grep -rn "documentElement.lang\|html.lang" --include="*.tsx" --include="*.ts" src/ | head -5
```

### 11. Run external audit (manual)

If dev server is running:

```bash
# axe-core CLI (if installed globally)
npx @axe-core/cli http://localhost:3000

# Lighthouse CLI
npx lighthouse http://localhost:3000 --only-categories=accessibility --chrome-flags="--headless"
```

### 12. Output report

```
=== Accessibility Audit (WCAG 2.1 AA) ===
Date: <today>

🔴 BLOCKING:
  Inputs without label: X
  Buttons without name: Y
  div/span with onClick (no role): Z
  <img> without alt: W

🟡 HIGH:
  Form errors not announced: A
  Heading hierarchy issues: B
  Color-only signals: C

🟢 NICE-TO-HAVE:
  Missing skip link: <yes|no>
  Lang attribute sync: <yes|no>
  Reduced motion CSS: <yes|no>

ESLint a11y violations: <count>
  yarn lint --rule "jsx-a11y/*"

External audit:
  Lighthouse a11y score: <X> / 100
  axe violations: <count>

Recommendation:
  - <total> P0 issues to fix before merge
  - Estimated effort: ~<N> hours
```

## Constraints

- Don't flag Radix UI primitives (already accessible via shadcn/ui)
- Don't require alt for purely decorative images marked `aria-hidden="true"`
- Don't flag `aria-label` content for being in English (i18n may handle separately)
- Don't recommend disabling jsx-a11y rules — fix the underlying issue
