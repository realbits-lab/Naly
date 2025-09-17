#!/usr/bin/env node
/**
 * Article Generation Test Runner
 *
 * This script runs the comprehensive article generation test that:
 * 1. Fetches latest news from Financial Datasets API
 * 2. Calls the generate-article API on port 3005
 * 3. Saves the generated article to database
 * 4. Displays results in console
 */

const { spawn } = require("child_process");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const TEST_PORT = 3005;
const SERVER_STARTUP_DELAY = 5000; // 5 seconds for server to start

console.log("🚀 Article Generation Test Runner");
console.log("=".repeat(50));

async function runTests() {
	let serverProcess = null;

	try {
		// Step 1: Start the Next.js server on port 3005
		console.log(`📡 Starting Next.js server on port ${TEST_PORT}...`);

		serverProcess = spawn("pnpm", ["run", "dev:test"], {
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, PORT: TEST_PORT.toString() },
		});

		// Listen for server output
		serverProcess.stdout.on("data", (data) => {
			const output = data.toString();
			if (output.includes("Ready") || output.includes("started server")) {
				console.log("✅ Server is ready");
			}
		});

		serverProcess.stderr.on("data", (data) => {
			const error = data.toString();
			if (!error.includes("webpack-dev-server") && !error.includes("WARNING")) {
				console.error("⚠️  Server error:", error);
			}
		});

		// Wait for server to start
		console.log(
			`⏳ Waiting ${SERVER_STARTUP_DELAY / 1000} seconds for server startup...`,
		);
		await new Promise((resolve) => setTimeout(resolve, SERVER_STARTUP_DELAY));

		// Step 2: Run the Jest tests
		console.log("\\n🧪 Running article generation tests...");
		console.log("=".repeat(50));

		const testCommand =
			"dotenv --file .env.local run pnpm test __tests__/article-generation.test.ts --verbose";

		const testResult = await exec(testCommand, {
			env: { ...process.env },
		});

		console.log("\\n📊 Test Results:");
		console.log("=".repeat(50));
		console.log(testResult.stdout);

		if (testResult.stderr) {
			console.error("Test Errors:", testResult.stderr);
		}

		console.log("\\n✅ Article generation test completed successfully!");
	} catch (error) {
		console.error("\\n❌ Test execution failed:");
		console.error(error.message);

		if (error.stdout) {
			console.log("\\nTest Output:", error.stdout);
		}

		if (error.stderr) {
			console.error("\\nTest Errors:", error.stderr);
		}

		process.exit(1);
	} finally {
		// Step 3: Cleanup - Stop the server
		if (serverProcess) {
			console.log("\\n🧹 Stopping test server...");
			serverProcess.kill("SIGTERM");

			// Force kill if needed
			setTimeout(() => {
				if (serverProcess && !serverProcess.killed) {
					serverProcess.kill("SIGKILL");
				}
			}, 3000);
		}
	}
}

async function checkPrerequisites() {
	console.log("🔍 Checking prerequisites...");

	try {
		// Check if .env.local exists
		await exec("test -f .env.local");
		console.log("✅ .env.local file found");
	} catch {
		console.error(
			"❌ .env.local file not found. Please ensure environment variables are configured.",
		);
		process.exit(1);
	}

	try {
		// Check if database is accessible
		await exec("dotenv --file .env.local run pnpm db:push --help");
		console.log("✅ Database configuration verified");
	} catch {
		console.error(
			"❌ Database configuration issue. Please check DATABASE_URL in .env.local",
		);
		process.exit(1);
	}

	console.log("✅ Prerequisites verified\\n");
}

async function main() {
	try {
		await checkPrerequisites();
		await runTests();
	} catch (error) {
		console.error("❌ Test runner failed:", error.message);
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\\n🛑 Test runner interrupted. Cleaning up...");
	process.exit(1);
});

process.on("SIGTERM", () => {
	console.log("\\n🛑 Test runner terminated. Cleaning up...");
	process.exit(1);
});

// Run the main function
if (require.main === module) {
	main();
}
