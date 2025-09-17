# Test Utils Directory

This directory contains testing utilities, scripts, and documentation for the Naly project.

## Files

### `run-article-test.js`
Automated test runner script for the article generation workflow. This script:
- Starts the Next.js server on port 3005
- Runs the comprehensive article generation tests
- Handles server lifecycle and cleanup
- Provides detailed console output

**Usage:**
```bash
pnpm run test:article
```

### `TEST_README.md`
Comprehensive documentation for the article generation test suite, including:
- Test architecture overview
- Running instructions
- Configuration details
- Troubleshooting guide
- Expected output examples

## Directory Purpose

The `test-utils/` directory serves as a centralized location for:
- ✅ Test runner scripts
- ✅ Test documentation
- ✅ Test utilities and helpers
- ✅ Test configuration files
- ✅ Mock data and fixtures (future)

This keeps test-related files organized and separate from the main application code while maintaining easy access for development and CI/CD processes.