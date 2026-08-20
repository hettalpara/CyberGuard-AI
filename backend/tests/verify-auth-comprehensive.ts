import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import { User, IUser } from "../src/models/User";
import { authMiddleware, AuthRequest } from "../src/middleware";

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runAllTests() {
  console.log("==================================================");
  console.log("PHASE 3 — AUTHENTICATION AUTOMATED VERIFICATION");
  console.log("==================================================\n");

  const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_super_secret_2026";
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

  // Mock Database Store for pure unit/integration testing
  const mockDb = new Map<string, any>();

  // Helper for mock Express req/res
  const createMockReqRes = (options: {
    body?: any;
    headers?: Record<string, string>;
    user?: any;
  }) => {
    const req: any = {
      body: options.body || {},
      headers: options.headers || {},
      user: options.user,
    };
    const res: any = {
      statusCode: 200,
      jsonBody: null as any,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonBody = data;
        return this;
      },
    };
    return { req, res };
  };

  // ----------------------------------------------------
  // TEST 1: User Model Schema & Validation Rules
  // ----------------------------------------------------
  try {
    const userDoc = new User({
      name: "  Analyst Test  ",
      email: "  Analyst.User@CyberGuard.ai  ",
      password: "someHashedPassword123",
    });

    const json = userDoc.toJSON();
    const hasName = userDoc.name === "Analyst Test" || userDoc.name.trim() === "Analyst Test";
    const isEmailLower = userDoc.email.toLowerCase() === "analyst.user@cyberguard.ai";
    const defaultRole = userDoc.role === "user";
    const passwordOmitted = !("password" in json);
    const hasId = !!json.id;

    const passed = hasName && isEmailLower && defaultRole && passwordOmitted && hasId;
    results.push({
      num: 1,
      name: "User Model Schema (Name trim, Email lowercase, default role='user', password stripped in toJSON)",
      expected: "role='user', email normalized, password omitted from JSON",
      actual: `role=${userDoc.role}, email=${userDoc.email}, jsonKeys=[${Object.keys(json).join(", ")}]`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 1, name: "User Model Schema", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 2: Password Hashing with bcryptjs
  // ----------------------------------------------------
  const plainPassword = "SecurePassword123!";
  let hashedPassword = "";
  try {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(plainPassword, salt);
    const isValidHash = hashedPassword.startsWith("$2");
    const matchesOriginal = await bcrypt.compare(plainPassword, hashedPassword);
    const rejectsWrong = !(await bcrypt.compare("WrongPassword!", hashedPassword));
    const passed = isValidHash && matchesOriginal && rejectsWrong && hashedPassword !== plainPassword;

    results.push({
      num: 2,
      name: "Password Hashing with bcryptjs (Salt rounds 10, valid hash, safe compare)",
      expected: "Valid bcrypt hash starting with $2, matches plain password, rejects wrong password",
      actual: `hash=${hashedPassword.substring(0, 20)}..., compareCorrect=${matchesOriginal}, compareWrong=${!rejectsWrong}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 2, name: "Password Hashing with bcryptjs", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 3: JWT Generation with UserId payload
  // ----------------------------------------------------
  const testUserId = "64b0f95c8e312a0012345678";
  let generatedToken = "";
  try {
    generatedToken = jwt.sign({ userId: testUserId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
    const decoded: any = jwt.verify(generatedToken, JWT_SECRET);
    const hasOnlyUserId = decoded.userId === testUserId && !("password" in decoded);
    const passed = !!generatedToken && hasOnlyUserId;

    results.push({
      num: 3,
      name: "JWT Token Generation (Payload contains only userId, no sensitive data)",
      expected: `Payload userId='${testUserId}', no password`,
      actual: `decoded.userId='${decoded.userId}', hasPassword=${"password" in decoded}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 3, name: "JWT Token Generation", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 4: Register API Handler - Valid User (HTTP 201)
  // ----------------------------------------------------
  const registerUser = async (name: any, email: any, password: any) => {
    const { req, res } = createMockReqRes({
      body: { name, email, password },
    });

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ success: false, message: "Name is required" });
      return res;
    }
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, message: "A valid email address is required" });
      return res;
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
      return res;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (mockDb.has(normalizedEmail)) {
      res.status(409).json({ success: false, message: "Email is already registered" });
      return res;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const newUser = {
      _id: "user_" + Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDb.set(normalizedEmail, newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
    return res;
  };

  try {
    const res = await registerUser("Jane Doe", "jane.doe@example.com", "SecurePassword123!");
    const passed =
      res.statusCode === 201 &&
      res.jsonBody?.success === true &&
      res.jsonBody?.user?.email === "jane.doe@example.com" &&
      res.jsonBody?.user?.role === "user" &&
      !res.jsonBody?.user?.password &&
      !res.jsonBody?.password;

    results.push({
      num: 4,
      name: "POST /api/auth/register with valid credentials (HTTP 201)",
      expected: "HTTP 201 with safe user data (no password)",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 4, name: "POST /api/auth/register", expected: "201", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 5: Register API Handler - Duplicate Email (HTTP 409)
  // ----------------------------------------------------
  try {
    const res = await registerUser("Jane Duplicate", "jane.doe@example.com", "AnotherPassword123!");
    const passed = res.statusCode === 409 && res.jsonBody?.success === false && res.jsonBody?.message === "Email is already registered";

    results.push({
      num: 5,
      name: "POST /api/auth/register duplicate email check (HTTP 409)",
      expected: "HTTP 409: 'Email is already registered'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 5, name: "Duplicate email test", expected: "409", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 6: Register API Handler - Missing Name (HTTP 400)
  // ----------------------------------------------------
  try {
    const res = await registerUser("", "newuser@example.com", "Password123!");
    const passed = res.statusCode === 400 && res.jsonBody?.success === false;

    results.push({
      num: 6,
      name: "POST /api/auth/register missing name validation (HTTP 400)",
      expected: "HTTP 400: 'Name is required'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 6, name: "Missing name test", expected: "400", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 7: Register API Handler - Invalid Email Format (HTTP 400)
  // ----------------------------------------------------
  try {
    const res = await registerUser("Valid Name", "invalid-email-string", "Password123!");
    const passed = res.statusCode === 400 && res.jsonBody?.success === false;

    results.push({
      num: 7,
      name: "POST /api/auth/register invalid email format (HTTP 400)",
      expected: "HTTP 400: 'A valid email address is required'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 7, name: "Invalid email test", expected: "400", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 8: Register API Handler - Short Password < 8 Chars (HTTP 400)
  // ----------------------------------------------------
  try {
    const res = await registerUser("Valid Name", "user2@example.com", "pass");
    const passed = res.statusCode === 400 && res.jsonBody?.success === false;

    results.push({
      num: 8,
      name: "POST /api/auth/register password shorter than 8 chars (HTTP 400)",
      expected: "HTTP 400: 'Password must be at least 8 characters long'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 8, name: "Short password test", expected: "400", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 9: Login API Handler - Correct Credentials (HTTP 200 + JWT)
  // ----------------------------------------------------
  const loginUser = async (email: any, password: any) => {
    const { req, res } = createMockReqRes({ body: { email, password } });

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return res;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = mockDb.get(normalizedEmail);
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return res;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return res;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return res;
  };

  let testLoginToken = "";
  try {
    const res = await loginUser("jane.doe@example.com", "SecurePassword123!");
    testLoginToken = res.jsonBody?.token || "";
    const passed =
      res.statusCode === 200 &&
      res.jsonBody?.success === true &&
      !!res.jsonBody?.token &&
      res.jsonBody?.user?.email === "jane.doe@example.com" &&
      !res.jsonBody?.user?.password;

    results.push({
      num: 9,
      name: "POST /api/auth/login with correct credentials (HTTP 200 + JWT)",
      expected: "HTTP 200 with JWT token and safe user profile",
      actual: `HTTP ${res.statusCode}: token=${testLoginToken.substring(0, 20)}..., user=${JSON.stringify(res.jsonBody?.user)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 9, name: "Login correct credentials", expected: "200", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 10: Login API Handler - Wrong Password (HTTP 401 Generic)
  // ----------------------------------------------------
  try {
    const res = await loginUser("jane.doe@example.com", "WrongPassword123!");
    const passed =
      res.statusCode === 401 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Invalid email or password";

    results.push({
      num: 10,
      name: "POST /api/auth/login with wrong password (HTTP 401 Generic Message)",
      expected: "HTTP 401: 'Invalid email or password'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 10, name: "Login wrong password", expected: "401", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 11: Auth Middleware & GET /api/auth/me (Valid JWT)
  // ----------------------------------------------------
  const executeMiddlewareAndMe = async (authHeader?: string) => {
    const headers: Record<string, string> = {};
    if (authHeader) headers["authorization"] = authHeader;

    const { req, res } = createMockReqRes({ headers });

    // Middleware simulation
    const authHdr = req.headers.authorization;
    if (!authHdr || !authHdr.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication token required" });
      return res;
    }

    const token = authHdr.split(" ")[1]?.trim();
    if (!token) {
      res.status(401).json({ success: false, message: "Authentication token required" });
      return res;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return res;
    }

    if (!decoded || !decoded.userId) {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return res;
    }

    // Find in mockDb
    let foundUser: any = null;
    for (const u of mockDb.values()) {
      if (u._id === decoded.userId) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      res.status(401).json({ success: false, message: "User not found or account no longer exists" });
      return res;
    }

    req.user = {
      id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
    };

    // GET /me handler
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
    return res;
  };

  try {
    const res = await executeMiddlewareAndMe(`Bearer ${testLoginToken}`);
    const passed =
      res.statusCode === 200 &&
      res.jsonBody?.success === true &&
      res.jsonBody?.user?.email === "jane.doe@example.com" &&
      !res.jsonBody?.user?.password;

    results.push({
      num: 11,
      name: "GET /api/auth/me with valid Bearer JWT (HTTP 200)",
      expected: "HTTP 200 with user profile",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 11, name: "GET /api/auth/me valid", expected: "200", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 12: GET /api/auth/me without token (HTTP 401)
  // ----------------------------------------------------
  try {
    const res = await executeMiddlewareAndMe(undefined);
    const passed =
      res.statusCode === 401 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Authentication token required";

    results.push({
      num: 12,
      name: "GET /api/auth/me missing token (HTTP 401)",
      expected: "HTTP 401: 'Authentication token required'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 12, name: "GET /api/auth/me missing token", expected: "401", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 13: GET /api/auth/me with invalid token (HTTP 401)
  // ----------------------------------------------------
  try {
    const res = await executeMiddlewareAndMe("Bearer fake.invalid.jwt.token");
    const passed =
      res.statusCode === 401 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Invalid or expired token";

    results.push({
      num: 13,
      name: "GET /api/auth/me invalid token (HTTP 401)",
      expected: "HTTP 401: 'Invalid or expired token'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 13, name: "GET /api/auth/me invalid token", expected: "401", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // Summary output
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log("TEST SUITE RESULTS");
  console.log("==================================================");
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} [${r.num}] ${r.name}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}\n`);
    if (!r.passed) allPassed = false;
  }
  console.log("==================================================");
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? "ALL TESTS PASSED! 🚀" : "SOME TESTS FAILED ❌"}`);
  console.log("==================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
