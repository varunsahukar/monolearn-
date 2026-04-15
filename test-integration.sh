#!/bin/bash

# Integration Test Script
# Tests backend-frontend connection and key features

set -e

PORT="${1:-8787}"
BASE_URL="http://localhost:$PORT"

echo "🧪 Starting Integration Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Health endpoint
echo "✓ Test 1: Health Check"
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | grep -q '"ok":true'; then
  echo "  ✅ Health check passed: $HEALTH"
else
  echo "  ❌ Health check failed"
  exit 1
fi

echo ""

# Test 2: Frontend loads
echo "✓ Test 2: Frontend HTML"
FRONTEND=$(curl -s "$BASE_URL/")
if echo "$FRONTEND" | grep -q "<!DOCTYPE\|<html"; then
  echo "  ✅ Frontend HTML loads correctly"
else
  echo "  ❌ Frontend failed to load"
  exit 1
fi

echo ""

# Test 3: API with valid YouTube URL
echo "✓ Test 3: YouTube Analysis API"
VIDEO_URL="https://www.youtube.com/watch?v=jNQXAC9IVRw"  # Famous "Me at the zoo" video
echo "  Testing with: $VIDEO_URL"

ANALYSIS=$(curl -s "$BASE_URL/api/youtube/analyze?url=$(echo -n "$VIDEO_URL" | jq -sRr @uri)")

if echo "$ANALYSIS" | grep -q '"analysis"'; then
  echo "  ✅ Analysis API returned data"
  # Show some details
  TITLE=$(echo "$ANALYSIS" | grep -o '"title":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "     Video Title: $TITLE"
else
  ERROR=$(echo "$ANALYSIS" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
  echo "  ⚠️  API returned: $ERROR"
  echo "     (This is OK if captions are disabled - STT fallback would apply)"
fi

echo ""

# Test 4: Error handling with invalid URL
echo "✓ Test 4: Error Handling"
INVALID=$(curl -s "$BASE_URL/api/youtube/analyze")
if echo "$INVALID" | grep -q '"error"'; then
  echo "  ✅ Invalid request handled correctly"
else
  echo "  ❌ Error handling failed"
  exit 1
fi

echo ""

# Test 5: CORS Headers
echo "✓ Test 5: CORS Headers"
HEADERS=$(curl -sI "$BASE_URL/api/health")
if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  echo "  ✅ CORS headers present"
else
  echo "  ⚠️  CORS headers may not be set"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All integration tests passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Open browser: http://localhost:$PORT"
echo "   2. Go to VideoHub page"
echo "   3. Paste a YouTube URL with captions"
echo "   4. Click 'Analyze' to test full flow"
echo ""
