# Article Generation Test Documentation

## Overview

This test suite provides comprehensive testing for the article generation workflow using Jest (not Playwright). The test validates the complete process of fetching news from the Financial Datasets API, generating articles using AI, and saving them to the database.

## Test Architecture

### Test File Location
- `__tests__/article-generation.test.ts` - Main test file following Jest default directory structure

### Test Components

1. **News Fetching Test**
   - Fetches latest news from Financial Datasets API
   - Validates news article structure and content
   - Verifies related information (sentiment, keywords, entities)

2. **Article Generation API Test**
   - Calls `/api/news/generate-article` endpoint on port 3005
   - Tests with both real API calls and mock fallback
   - Validates generated article structure and metadata

3. **Database Verification Test**
   - Verifies articles are properly saved to database
   - Checks all required fields and data integrity
   - Displays saved article details

4. **Workflow Summary Test**
   - Shows complete workflow results
   - Lists recent articles in database
   - Provides comprehensive test summary

## Running the Tests

### Method 1: Automated Test Runner (Recommended)
```bash
# Runs server on port 3005 and executes tests automatically
pnpm run test:article
```

### Method 2: Manual Setup
```bash
# Terminal 1: Start server on port 3005
pnpm run dev:test

# Terminal 2: Run tests (after server is ready)
dotenv --file .env.local run pnpm test __tests__/article-generation.test.ts --verbose
```

### Method 3: Individual Jest Commands
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run with coverage
pnpm run test:coverage
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses `ts-jest` preset for TypeScript support
- Node.js test environment
- 30-second timeout for long-running operations
- Path mapping for `@/` imports

### Environment Setup (`jest.setup.js`)
- Loads `.env.local` environment variables
- Configures test utilities and helpers
- Sets up global test timeout

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `FINANCIAL_DATASETS_API_KEY` - API key for news fetching
- `OPENAI_API_KEY` - Optional, falls back to mock generation

## Test Output

The test provides detailed console output including:

```
📰 Successfully fetched news:
   📄 Title: [Article Title]
   🏢 Source: [News Source]
   📅 Published: [Publication Date]
   🔗 URL: [Article URL]
   📊 Sentiment: [positive/negative/neutral]

🤖 Article generation API successful:
   📄 Generated Title: [Generated Title]
   🆔 Article ID: [Database ID]
   💾 Saved At: [Timestamp]
   📊 Word Count: [Count]
   ⏱️  Reading Time: [Minutes]

✅ Article found in database:
   🆔 ID: [Database ID]
   📄 Title: [Article Title]
   📅 Created At: [Timestamp]
```

## Test Features

### Comprehensive Workflow Testing
- ✅ News API integration
- ✅ Article generation via AI
- ✅ Database persistence
- ✅ Error handling and fallbacks
- ✅ Authentication handling
- ✅ Data validation

### Robust Error Handling
- Graceful fallback to mock generation if API unavailable
- Comprehensive error logging
- Proper test cleanup and resource management

### Database Integration
- Real database operations
- Automatic cleanup of test data
- Verification of data integrity

## Development Notes

### Port Configuration
- Uses port 3005 for testing to avoid conflicts with development server
- Configurable via `TEST_PORT` constant in test file

### Authentication
- Handles authentication requirements for protected endpoints
- Falls back to mock generation when authentication is not available

### Performance
- Tests are designed to run within 30-second timeouts
- Parallel execution safe with proper test isolation

## Troubleshooting

### Common Issues

1. **Server not ready**
   - Increase `SERVER_STARTUP_DELAY` in `run-article-test.js`
   - Check if port 3005 is available

2. **Database connection issues**
   - Verify `DATABASE_URL` in `.env.local`
   - Ensure database migrations are applied

3. **API authentication errors**
   - Test falls back to mock generation
   - Check NextAuth configuration if needed

4. **Test timeouts**
   - Increase timeout values in Jest configuration
   - Check network connectivity for API calls

### Debug Mode
```bash
# Run with verbose output
pnpm test __tests__/article-generation.test.ts --verbose --no-cache
```

## Dependencies

### Core Testing
- `jest` - Testing framework
- `ts-jest` - TypeScript support
- `@jest/globals` - Jest global functions

### API Testing
- `node-fetch` - HTTP requests
- Custom database integration via Drizzle ORM

### Environment
- `dotenv` - Environment variable loading
- Database connection via existing configuration

This test suite provides a complete validation of the article generation workflow, ensuring all components work together correctly while providing detailed feedback on the process.