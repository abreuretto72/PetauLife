#!/usr/bin/env bash
# auExpert Pre-flight Health Check
# Usage: bash scripts/preflight.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PASS="✅" WARN="⚠️ " FAIL="❌"
ISSUES=0

echo ""
echo "════════════════════════════════════════"
echo "  auExpert Pre-flight Health Check"
echo "════════════════════════════════════════"
echo ""

# ── 1. CLI TOOLS ─────────────────────────────
echo "── 1. CLI Tools ──"

check_tool() {
  local name=$1 cmd=$2 min_warn=$3
  if ver=$(eval "$cmd" 2>/dev/null | head -1); then
    echo "  $PASS $name: $ver"
  else
    echo "  $FAIL $name: NOT FOUND"
    ISSUES=$((ISSUES+1))
  fi
}

check_tool "node"     "node --version"                     ""
check_tool "npm"      "npm --version"                      ""
check_tool "eas-cli"  "eas --version 2>&1 | grep eas-cli"  ""
check_tool "supabase" "supabase --version"                  ""
check_tool "expo"     "npx expo --version"                  ""

# EAS update check
if eas --version 2>&1 | grep -q "is now available"; then
  echo "  $WARN eas-cli: update available (run: npm install -g eas-cli)"
fi
if supabase --version 2>&1 | grep -q "new version"; then
  echo "  $WARN supabase CLI: update available"
fi

echo ""

# ── 2. ENV VARIABLES ─────────────────────────
echo "── 2. Environment Variables ──"

REQUIRED_VARS=(
  "EXPO_PUBLIC_SUPABASE_URL"
  "EXPO_PUBLIC_SUPABASE_ANON_KEY"
)

# Load .env
if [ -f .env ]; then
  set -o allexport && source .env && set +o allexport
fi
if [ -f .env.local ]; then
  set -o allexport && source .env.local && set +o allexport
fi

for var in "${REQUIRED_VARS[@]}"; do
  if [ -n "${!var:-}" ]; then
    echo "  $PASS $var: set"
  else
    echo "  $FAIL $var: MISSING in .env or .env.local"
    ISSUES=$((ISSUES+1))
  fi
done

# SUPABASE_SERVICE_ROLE_KEY is only needed in Edge Functions (Deno), not client
echo "  $PASS SUPABASE_SERVICE_ROLE_KEY: Edge Functions only (Deno env — OK)"

echo ""

# ── 3. SCHEMA DRIFT ──────────────────────────
echo "── 3. Schema Drift ──"
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  echo "  Comparing migrations vs remote..."
  if supabase db diff 2>&1 | grep -q "No changes"; then
    echo "  $PASS Schema: no drift detected"
  else
    echo "  $WARN Schema drift detected — review 'supabase db diff' output"
    ISSUES=$((ISSUES+1))
  fi
else
  echo "  $WARN Docker not running — skipping local schema diff"
  echo "       Use Supabase MCP to query information_schema manually"
fi

echo ""

# ── 4. ANDROID / JDK ─────────────────────────
echo "── 4. Android / JDK ──"

JAVA_VER=$(java -version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
JAVA_MAJOR=$(echo "$JAVA_VER" | cut -d. -f1)
if [ "$JAVA_MAJOR" -ge 17 ]; then
  echo "  $PASS JDK: $JAVA_VER (>= 17 required)"
else
  echo "  $FAIL JDK: $JAVA_VER (need >= 17 for Android builds)"
  ISSUES=$((ISSUES+1))
fi

JAVA_HOME_VER=$(echo "$JAVA_HOME" | grep -oE '[0-9]+\.[0-9]+' | head -1)
if echo "$JAVA_HOME" | grep -qE "jre1\.8|jdk1\.8|java-8"; then
  echo "  $WARN JAVA_HOME points to Java 8 ($JAVA_HOME)"
  echo "       EAS cloud builds use their own JDK — local builds may fail"
  echo "       Fix: set JAVA_HOME to your JDK 17 path"
else
  echo "  $PASS JAVA_HOME: $JAVA_HOME"
fi

if [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME" ]; then
  echo "  $PASS ANDROID_HOME: $ANDROID_HOME"
else
  echo "  $WARN ANDROID_HOME: not set (only needed for local 'expo run:android')"
fi

echo ""

# ── 5. HARDCODED SECRETS ─────────────────────
echo "── 5. Hardcoded Secrets / Test Data ──"

# Check for secrets in source files (excluding node_modules, eas.json, .env)
SECRET_PATTERNS="sk-ant-|AKIA[0-9A-Z]{16}|eyJhbGciOiJIUzI1NiJ9"
FOUND=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" \
  -l "$SECRET_PATTERNS" . \
  --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || true)
if [ -z "$FOUND" ]; then
  echo "  $PASS No hardcoded API keys found in source files"
else
  echo "  $FAIL Possible secrets in: $FOUND"
  ISSUES=$((ISSUES+1))
fi

# Check for mock data in production screens (not tests)
MOCK_FILES=$(grep -rl "mockCapsules\|mock_data\|dummy_pet" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=__tests__ . 2>/dev/null || true)
if [ -n "$MOCK_FILES" ]; then
  echo "  $WARN Mock data in production files:"
  for f in $MOCK_FILES; do echo "       $f"; done
  echo "       Review: ensure mock data has real DB fallback"
else
  echo "  $PASS No mock data in production screens"
fi

echo ""

# ── SUMMARY ──────────────────────────────────
echo "════════════════════════════════════════"
if [ "$ISSUES" -eq 0 ]; then
  echo "  $PASS All checks passed — ready to code!"
else
  echo "  $FAIL $ISSUES issue(s) found — review above before starting"
fi
echo "════════════════════════════════════════"
echo ""
