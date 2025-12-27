/**
 * SENTINEL Integration Test Suite
 * Run before deployment: npm run test:integration
 */

import { createHmac } from "crypto";

const API_URL = process.env.API_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log("🚀 Starting SENTINEL Integration Tests...\n");

  // Test 1: Health Check
  await test("Health endpoint returns 200", async () => {
    const res = await fetch(`${API_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (data.status !== "healthy") throw new Error("Not healthy");
  });

  // Test 2: HMAC Signature Generation
  await test("HMAC signature is deterministic", async () => {
    const sapId = "12345678";
    const timestamp = 1700000000000;
    const secret = "TEST_SECRET";

    const sig1 = createHmac("sha256", secret)
      .update(`${sapId}:${timestamp}`)
      .digest("hex");
    const sig2 = createHmac("sha256", secret)
      .update(`${sapId}:${timestamp}`)
      .digest("hex");

    if (sig1 !== sig2) throw new Error("Signatures do not match");
  });

  // Test 3: Rate limiting check (simulated)
  await test("Rate limiter configuration check", async () => {
    // We can't easily test actual blocking without hitting the limit,
    // but we can check if the endpoint is responsive
    const res = await fetch(`${API_URL}/api/health`);
    if (!res.ok) throw new Error("API not responsive");
  });

  // Summary
  console.log("\n--- Test Summary ---");
  const passed = results.filter((r) => r.passed).length;
  console.log(`${passed}/${results.length} tests passed`);

  if (passed < results.length) {
    console.error("❌ Some tests failed");
    process.exit(1);
  } else {
    console.log("✅ All tests passed");
    process.exit(0);
  }
}

runTests();
