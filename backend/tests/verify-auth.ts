import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

import { connectDB } from "../src/db";
import { User } from "../src/models/User";

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/auth`;

interface TestResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runTests() {
  console.log("==================================================");
  console.log("STARTING PHASE 3 AUTHENTICATION TEST SUITE");
  console.log("==================================================\n");

  await connectDB();

  const testEmail = `test.analyst.${Date.now()}@cyberguard.test`;
  const testPassword = "Password123!";
  const testName = "Test Analyst User";
  let authToken = "";

  const request = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  // Test 1: Register valid user (Expected 201)
  try {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    const passed =
      res.status === 201 &&
      res.data?.success === true &&
      res.data?.user?.email === testEmail.toLowerCase() &&
      !res.data?.user?.password &&
      !res.data?.password;

    results.push({
      name: "1. Register valid user",
      expected: "HTTP 201 with safe user data (no password)",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "1. Register valid user", expected: "201", actual: e.message, passed: false });
  }

  // Test 2: Register same email (Duplicate - Expected 409)
  try {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail,
        password: "AnotherPassword123",
      }),
    });
    const passed = res.status === 409 && res.data?.success === false && res.data?.message === "Email is already registered";
    results.push({
      name: "2. Register same email (Duplicate)",
      expected: "HTTP 409 (Email is already registered)",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "2. Register same email", expected: "409", actual: e.message, passed: false });
  }

  // Test 3: Register without name (Expected 400)
  try {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        email: `noname.${Date.now()}@example.com`,
        password: testPassword,
      }),
    });
    const passed = res.status === 400 && res.data?.success === false;
    results.push({
      name: "3. Register without name",
      expected: "HTTP 400",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "3. Register without name", expected: "400", actual: e.message, passed: false });
  }

  // Test 4: Invalid email format (Expected 400)
  try {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Invalid Email User",
        email: "not-a-valid-email",
        password: testPassword,
      }),
    });
    const passed = res.status === 400 && res.data?.success === false;
    results.push({
      name: "4. Invalid email format",
      expected: "HTTP 400",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "4. Invalid email format", expected: "400", actual: e.message, passed: false });
  }

  // Test 5: Password shorter than 8 characters (Expected 400)
  try {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Short Pass",
        email: `shortpass.${Date.now()}@example.com`,
        password: "short",
      }),
    });
    const passed = res.status === 400 && res.data?.success === false;
    results.push({
      name: "5. Password shorter than 8 characters",
      expected: "HTTP 400",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "5. Password shorter than 8 characters", expected: "400", actual: e.message, passed: false });
  }

  // Test 6: Login correct credentials (Expected 200 + JWT)
  try {
    const res = await request("/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    authToken = res.data?.token || "";
    const passed =
      res.status === 200 &&
      res.data?.success === true &&
      !!res.data?.token &&
      res.data?.user?.email === testEmail.toLowerCase() &&
      !res.data?.user?.password;

    results.push({
      name: "6. Login correct credentials",
      expected: "HTTP 200 with JWT token and safe user info",
      actual: `HTTP ${res.status}: token=${authToken ? authToken.substring(0, 20) + "..." : "NONE"}, user=${JSON.stringify(res.data?.user)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "6. Login correct credentials", expected: "200", actual: e.message, passed: false });
  }

  // Test 7: Login wrong password (Expected 401 - generic message)
  try {
    const res = await request("/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword999!",
      }),
    });
    const passed =
      res.status === 401 &&
      res.data?.success === false &&
      res.data?.message === "Invalid email or password";

    results.push({
      name: "7. Login wrong password",
      expected: "HTTP 401 (Invalid email or password)",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "7. Login wrong password", expected: "401", actual: e.message, passed: false });
  }

  // Test 8: GET /api/auth/me with valid JWT (Expected 200)
  try {
    const res = await request("/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const passed =
      res.status === 200 &&
      res.data?.success === true &&
      res.data?.user?.email === testEmail.toLowerCase() &&
      !res.data?.user?.password;

    results.push({
      name: "8. GET /api/auth/me with valid JWT",
      expected: "HTTP 200 with user data",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "8. GET /api/auth/me with valid JWT", expected: "200", actual: e.message, passed: false });
  }

  // Test 9: GET /api/auth/me without token (Expected 401)
  try {
    const res = await request("/me", {
      method: "GET",
    });
    const passed = res.status === 401 && res.data?.success === false;
    results.push({
      name: "9. GET /api/auth/me without token",
      expected: "HTTP 401 (Authentication token required)",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "9. GET /api/auth/me without token", expected: "401", actual: e.message, passed: false });
  }

  // Test 10: GET /api/auth/me with invalid token (Expected 401)
  try {
    const res = await request("/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.jwt.token.here",
      },
    });
    const passed = res.status === 401 && res.data?.success === false;
    results.push({
      name: "10. GET /api/auth/me with invalid token",
      expected: "HTTP 401 (Invalid or expired token)",
      actual: `HTTP ${res.status}: ${JSON.stringify(res.data)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ name: "10. GET /api/auth/me with invalid token", expected: "401", actual: e.message, passed: false });
  }

  // Test 11: Direct MongoDB Atlas Inspection
  try {
    const dbUser = await User.findOne({ email: testEmail.toLowerCase() });
    const isBcrypt = dbUser?.password && dbUser.password.startsWith("$2");
    const noPlain = dbUser?.password !== testPassword;
    const hasRole = dbUser?.role === "user";
    const hasTimestamps = !!dbUser?.createdAt && !!dbUser?.updatedAt;
    const passed = !!(dbUser && isBcrypt && noPlain && hasRole && hasTimestamps);

    results.push({
      name: "11. MongoDB Atlas User Document Verification",
      expected: "Password hashed with bcrypt ($2...), role='user', timestamps present",
      actual: `Doc: id=${dbUser?._id}, name=${dbUser?.name}, email=${dbUser?.email}, role=${dbUser?.role}, passwordHash=${dbUser?.password?.substring(0, 15)}..., createdAt=${dbUser?.createdAt}`,
      passed,
    });

    // Cleanup test user
    if (dbUser) {
      await User.deleteOne({ _id: dbUser._id });
    }
  } catch (e: any) {
    results.push({ name: "11. MongoDB Atlas Verification", expected: "Pass", actual: e.message, passed: false });
  }

  // Print results summary
  console.log("\n==================================================");
  console.log("TEST RESULTS SUMMARY");
  console.log("==================================================");
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} | ${r.name}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}`);
    if (!r.passed) allPassed = false;
  }
  console.log("==================================================");
  console.log(`OVERALL: ${allPassed ? "ALL 11 TESTS PASSED SUCCESSFULLY! 🚀" : "SOME TESTS FAILED ❌"}`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(allPassed ? 0 : 1);
}

runTests();
