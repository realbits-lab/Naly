#!/bin/bash

# Local cron script for Naly
# This script calls the /api/cron/tick endpoint

LOG_DIR="/Users/thomasjeon/GitHub/@dev.realbits/Naly/logs"
LOG_FILE="$LOG_DIR/cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 1. Ensure logs directory exists
mkdir -p "$LOG_DIR"

# 2. Call the cron endpoint
echo "[$TIMESTAMP] Running cron tick..." >> "$LOG_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" "http://192.168.0.27:5000/api/cron/tick" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# 3. Log the result
echo "[$TIMESTAMP] HTTP Status: $HTTP_CODE" >> "$LOG_FILE"
echo "[$TIMESTAMP] Response: $BODY" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
