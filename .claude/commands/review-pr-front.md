---
description: Run a comprehensive frontend PR review using all specialized subagents in parallel
argument-hint: [PR_number_or_branch]
allowed-tools: Bash, Read, Grep, Glob, Agent
---

Multi-agent frontend PR review for: ${ARGUMENTS:-current branch}

## Workflow

### 1. Identify changed files

```bash
cd /home/adm1n/projects/startup/hemis-front

# If PR number
gh pr diff $ARGUMENTS --name-only 2>/dev/null

# If branch
git diff --name-only main...HEAD 2>/dev/null

# Working tree
git diff --name-only HEAD
```

Categorize:

- React components/pages: `src/**/*.tsx`
- Hooks: `src/hooks/*.ts`
- API services: `src/api/*.ts`
- Stores: `src/stores/*.ts`
- Translation files: `src/i18n/translations/*.json`
- Styles: `*.css`
- Tests: `*.test.*`

### 2. Show PR summary

```
=== Frontend PR Review: <branch or #PR> ===
Files changed: N
  Components: X
  Pages: Y
  Hooks: Z
  API: A
  Stores: B
  Tests: T

Lines: +AAAA / -BBB
```

### 3. Launch agents in parallel

Use the `Agent` tool with multiple invocations in a single message.

#### a) React Anti-Patterns (any .tsx/.ts changed)

```
Agent({
  subagent_type: "react-anti-patterns",
  description: "React anti-pattern audit",
  prompt: "Review these changed React/TS files: <list>. Detect useEffect API calls, console.log, hardcoded URLs/colors, inline styles, DOM manipulation, missing memoization, dependency array issues."
})
```

#### b) i18n Checker (any .tsx changed)

```
Agent({
  subagent_type: "i18n-checker",
  description: "i18n compliance audit",
  prompt: "Check i18n compliance in: <list>. Detect hardcoded user-facing strings (Uzbek/Russian/English), missing t() wrappers, missing translation keys, static interpolation."
})
```

#### c) Accessibility (UI components/pages changed)

```
Agent({
  subagent_type: "accessibility-checker",
  description: "WCAG 2.1 AA audit",
  prompt: "Audit accessibility in: <list>. Check missing labels, button accessible names, click handlers on non-interactive, missing alt, heading hierarchy, form error announcement."
})
```

#### d) Query Pattern (hooks/API/pages with queries)

```
Agent({
  subagent_type: "query-pattern-reviewer",
  description: "TanStack Query audit",
  prompt: "Review TanStack Query usage in: <list>. Verify centralized query keys, mutation invalidation, enabled flag, retry config, staleTime appropriateness."
})
```

### 4. Run static checks in parallel

```bash
yarn lint --max-warnings 0 2>&1 | tee /tmp/lint.log
yarn type-check 2>&1 | tee /tmp/typecheck.log
yarn test --run --reporter=basic 2>&1 | tee /tmp/test.log
```

### 5. Bundle size check (if vite build available)

```bash
yarn build 2>&1 | tee /tmp/build.log
# Check chunk sizes
grep -A5 "dist/" /tmp/build.log | head -30
```

Watch for:

- Main bundle > 500KB (warning)
- xlsx not dynamically imported (large chunk)
- Sentry imported eagerly (consider lazy)

### 6. Test coverage delta

```bash
git diff main...HEAD --name-only -- 'src/**/*.{ts,tsx}' | grep -v "test\|__tests__" | \
while read f; do
    # Check if matching test exists
    base=$(basename "$f" | sed 's/\\.tsx\\?$//')
    found=$(find . -name "${base}.test.*" 2>/dev/null | head -1)
    if [ -z "$found" ]; then
        echo "NO TEST: $f"
    fi
done
```

### 7. Aggregate findings

Wait for all agents to complete. Collate:

```
=== Aggregated Review ===

🔴 P0 BLOCKING:
  React: <N findings>
  i18n: <N findings>
  a11y: <N findings>
  Query: <N findings>
  Lint: <N errors>
  TypeScript: <N errors>
  Tests: <N failures>

🟡 P1 HIGH:
  ...

🟢 P2 IMPROVEMENTS:
  ...

Files without tests: <list>
Bundle warnings: <list>
```

### 8. Final verdict

```
=== Verdict ===

P0 blocking: <N>
P1 high: <N>
P2 minor: <N>

Recommendation: ❌ REQUEST CHANGES | ✅ APPROVE | ⚠ APPROVE WITH SUGGESTIONS

Required before merge:
  1. Fix <X> hardcoded strings (i18n)
  2. Fix <Y> a11y violations (jsx-a11y)
  3. Fix <Z> useEffect API calls (use useQuery)
  4. Fix lint errors

Suggested follow-ups:
  - Add tests for <files>
  - Consider lazy loading <heavy deps>
```

If 0 P0 + 0 P1 → `✅ APPROVE`. Otherwise → `❌ REQUEST CHANGES`.

## Constraints

- Always run agents in PARALLEL (single message with multiple Agent tool calls)
- Skip agents that don't apply (e.g., no a11y check if no UI components changed)
- Don't approve PR with P0 findings
- For automated CI: exit code = number of P0 findings
