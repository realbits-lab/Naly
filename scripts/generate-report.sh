#!/bin/bash

API_KEY="naly_test_7687773d9c0b0dbe1334b27fe61014bab3af656d5f2881f5cf39c50d0031e6be"

echo "📊 Generating report with raw data preservation..."

# Generate the report
RESPONSE=$(curl -X POST http://localhost:4000/api/monitor/generate-report \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{}' \
  --max-time 300 -s)

# Extract report ID
REPORT_ID=$(echo "$RESPONSE" | grep -o '"reportId":"[^"]*' | cut -d'"' -f4)

if [ -z "$REPORT_ID" ]; then
  echo "❌ Failed to generate report:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Report generated successfully!"
echo "📄 Report ID: $REPORT_ID"

# Fetch the report content
echo "📖 Fetching report content..."
REPORT_CONTENT=$(curl -X GET "http://localhost:4000/api/articles/${REPORT_ID}" \
  -H "X-API-Key: ${API_KEY}" \
  -s)

# Save to file
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S")
FILENAME="raw-data-report-${TIMESTAMP}.md"
FILEPATH="/Users/thomasjeon/GitHub/@dev.realbits/Naly/articles/${FILENAME}"

echo "$REPORT_CONTENT" | grep -o '"content":"[^"]*' | cut -d'"' -f4 | sed 's/\\n/\n/g' | sed 's/\\"/"/g' > "$FILEPATH"

echo "💾 Report saved to: articles/${FILENAME}"

# Analyze the report for raw data preservation
echo ""
echo "🔍 Analyzing Raw Data Preservation..."

# Check for key sections
if grep -q "Complete Data Appendix" "$FILEPATH"; then
  echo "✅ Complete Data Appendix: Present"
else
  echo "❌ Complete Data Appendix: Missing"
fi

if grep -q "Raw Financial Data" "$FILEPATH"; then
  echo "✅ Raw Financial Data: Present"
else
  echo "❌ Raw Financial Data: Missing"
fi

JSON_BLOCKS=$(grep -c '```json' "$FILEPATH" 2>/dev/null || echo 0)
echo "✅ JSON Code Blocks: ${JSON_BLOCKS} found"

# Count numerical data
LARGE_NUMBERS=$(grep -o '\$[0-9,]*,000' "$FILEPATH" | wc -l | tr -d ' ')
echo "📊 Large Numbers Found: ${LARGE_NUMBERS}"

PERCENTAGES=$(grep -o '[0-9]\+\.[0-9]\+%' "$FILEPATH" | wc -l | tr -d ' ')
echo "📊 Percentages Found: ${PERCENTAGES}"

echo ""
echo "🏁 Report generation complete!"