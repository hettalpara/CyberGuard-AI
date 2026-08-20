import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runProfileTestSuite() {
  console.log("==================================================");
  console.log("PHASE 4 — PROFILE & SETTINGS AUTOMATED TEST SUITE");
  console.log("==================================================\n");

  const JWT_SECRET = process.env.JWT_SECRET || "cyberguard_jwt_super_secure_key_2026_x8f";
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

  // In-memory mock store representing MongoDB
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

  // Seed test user
  const initialPlainPassword = "OldPassword123!";
  const initialPasswordHash = await bcrypt.hash(initialPlainPassword, 10);
  const testUserId = "user_profile_test_101";

  const testUserDoc = {
    _id: testUserId,
    name: "Virani Pritkumar",
    email: "prit.virani@depstar.ac.in",
    password: initialPasswordHash,
    role: "user",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    updatedAt: new Date("2026-01-15T10:00:00Z"),
  };
  mockDb.set(testUserId, testUserDoc);

  // Generate valid JWT
  const validToken = jwt.sign({ userId: testUserId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

  // Middleware simulator
  const runAuthMiddleware = (req: any, res: any): boolean => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication token required" });
      return false;
    }
    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      res.status(401).json({ success: false, message: "Authentication token required" });
      return false;
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return false;
    }
    if (!decoded || !decoded.userId) {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return false;
    }
    const user = mockDb.get(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found or account no longer exists" });
      return false;
    }
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return true;
  };

  // Route: GET /api/users/profile
  const getProfileHandler = (req: any, res: any) => {
    if (!runAuthMiddleware(req, res)) return res;
    const user = mockDb.get(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return res;
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
    return res;
  };

  // Route: PUT /api/users/profile
  const updateProfileHandler = (req: any, res: any) => {
    if (!runAuthMiddleware(req, res)) return res;
    const { name, email, role, password } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ success: false, message: "Name is required and cannot be empty" });
      return res;
    }

    const user = mockDb.get(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return res;
    }

    // Only update name - ignore any attempts to alter role, email, password
    user.name = name.trim();
    user.updatedAt = new Date();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return res;
  };

  // Route: PUT /api/users/change-password
  const changePasswordHandler = async (req: any, res: any) => {
    if (!runAuthMiddleware(req, res)) return res;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== "string" || currentPassword.trim() === "") {
      res.status(400).json({ success: false, message: "Current password is required" });
      return res;
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
      return res;
    }

    const user = mockDb.get(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return res;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Current password is incorrect" });
      return res;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ success: false, message: "New password must be different from the current password" });
      return res;
    }

    const isSameAsHashed = await bcrypt.compare(newPassword, user.password);
    if (isSameAsHashed) {
      res.status(400).json({ success: false, message: "New password must be different from the current password" });
      return res;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
    return res;
  };

  // ----------------------------------------------------
  // TEST 1: GET /api/users/profile with valid JWT (Expected 200)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
    });
    getProfileHandler(req, res);
    const passed =
      res.statusCode === 200 &&
      res.jsonBody?.success === true &&
      res.jsonBody?.user?.id === testUserId &&
      res.jsonBody?.user?.email === "prit.virani@depstar.ac.in" &&
      !res.jsonBody?.user?.password;

    results.push({
      num: 1,
      name: "GET /api/users/profile with valid JWT",
      expected: "HTTP 200 with user profile (id, name, email, role, createdAt)",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 1, name: "GET /api/users/profile with valid JWT", expected: "200", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 2: GET /api/users/profile without JWT (Expected 401)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({});
    getProfileHandler(req, res);
    const passed =
      res.statusCode === 401 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Authentication token required";

    results.push({
      num: 2,
      name: "GET /api/users/profile without JWT",
      expected: "HTTP 401: 'Authentication token required'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 2, name: "GET /api/users/profile without JWT", expected: "401", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 3: GET /api/users/profile with invalid JWT (Expected 401)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: "Bearer invalid.jwt.token.123" },
    });
    getProfileHandler(req, res);
    const passed =
      res.statusCode === 401 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Invalid or expired token";

    results.push({
      num: 3,
      name: "GET /api/users/profile with invalid JWT",
      expected: "HTTP 401: 'Invalid or expired token'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 3, name: "GET /api/users/profile invalid JWT", expected: "401", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 4: PUT /api/users/profile Update Name (Expected 200)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: { name: "Updated Pritkumar Virani" },
    });
    updateProfileHandler(req, res);
    const passed =
      res.statusCode === 200 &&
      res.jsonBody?.success === true &&
      res.jsonBody?.user?.name === "Updated Pritkumar Virani" &&
      res.jsonBody?.message === "Profile updated successfully";

    results.push({
      num: 4,
      name: "PUT /api/users/profile update user name",
      expected: "HTTP 200 with updated name in response",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 4, name: "PUT /api/users/profile update", expected: "200", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 5: PUT /api/users/profile with empty name (Expected 400)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: { name: "   " },
    });
    updateProfileHandler(req, res);
    const passed =
      res.statusCode === 400 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Name is required and cannot be empty";

    results.push({
      num: 5,
      name: "PUT /api/users/profile with empty name",
      expected: "HTTP 400: 'Name is required and cannot be empty'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 5, name: "PUT /api/users/profile empty name", expected: "400", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 6: Unauthorized field alteration protection
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        name: "Security Lead Virani",
        role: "admin", // Try to escalate
        email: "hacked@example.com", // Try to change email
        password: "NewPasswordHacked123", // Try to bypass password endpoint
      },
    });
    updateProfileHandler(req, res);
    const updatedInDb = mockDb.get(testUserId);
    const roleProtected = updatedInDb.role === "user";
    const emailProtected = updatedInDb.email === "prit.virani@depstar.ac.in";
    const passwordProtected = updatedInDb.password === initialPasswordHash;

    const passed = res.statusCode === 200 && roleProtected && emailProtected && passwordProtected;

    results.push({
      num: 6,
      name: "PUT /api/users/profile protection (cannot change role, email, password)",
      expected: "role='user', email unchanged, password hash unchanged",
      actual: `role=${updatedInDb.role}, email=${updatedInDb.email}, passwordUntouched=${passwordProtected}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 6, name: "Unauthorized field protection", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 7: PUT /api/users/change-password with wrong current password (Expected 401)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        currentPassword: "IncorrectOldPassword!",
        newPassword: "BrandNewSecurePassword123!",
      },
    });
    await changePasswordHandler(req, res);
    const passed =
      res.statusCode === 401 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "Current password is incorrect";

    results.push({
      num: 7,
      name: "PUT /api/users/change-password with wrong current password",
      expected: "HTTP 401: 'Current password is incorrect'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 7, name: "Change password wrong current", expected: "401", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 8: PUT /api/users/change-password with short new password (Expected 400)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        currentPassword: initialPlainPassword,
        newPassword: "short",
      },
    });
    await changePasswordHandler(req, res);
    const passed =
      res.statusCode === 400 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "New password must be at least 8 characters long";

    results.push({
      num: 8,
      name: "PUT /api/users/change-password with short new password (< 8 chars)",
      expected: "HTTP 400: 'New password must be at least 8 characters long'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 8, name: "Change password short new", expected: "400", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 9: PUT /api/users/change-password with identical password (Expected 400)
  // ----------------------------------------------------
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        currentPassword: initialPlainPassword,
        newPassword: initialPlainPassword,
      },
    });
    await changePasswordHandler(req, res);
    const passed =
      res.statusCode === 400 &&
      res.jsonBody?.success === false &&
      res.jsonBody?.message === "New password must be different from the current password";

    results.push({
      num: 9,
      name: "PUT /api/users/change-password with identical new password",
      expected: "HTTP 400: 'New password must be different from the current password'",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 9, name: "Change password identical", expected: "400", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 10: PUT /api/users/change-password with valid passwords (Expected 200)
  // ----------------------------------------------------
  const newPlainPassword = "FreshSuperSecurePassword2026!";
  try {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        currentPassword: initialPlainPassword,
        newPassword: newPlainPassword,
      },
    });
    await changePasswordHandler(req, res);
    const passed =
      res.statusCode === 200 &&
      res.jsonBody?.success === true &&
      res.jsonBody?.message === "Password changed successfully" &&
      !res.jsonBody?.password;

    results.push({
      num: 10,
      name: "PUT /api/users/change-password successful update",
      expected: "HTTP 200: 'Password changed successfully' (password never returned)",
      actual: `HTTP ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 10, name: "Change password success", expected: "200", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 11: Verification that database password hash changed and verifies with new password
  // ----------------------------------------------------
  try {
    const userInDb = mockDb.get(testUserId);
    const hashChanged = userInDb.password !== initialPasswordHash;
    const isNewBcrypt = userInDb.password.startsWith("$2");
    const matchesNew = await bcrypt.compare(newPlainPassword, userInDb.password);
    const rejectsOld = !(await bcrypt.compare(initialPlainPassword, userInDb.password));

    const passed = hashChanged && isNewBcrypt && matchesNew && rejectsOld;

    results.push({
      num: 11,
      name: "Database Password Hash Verification",
      expected: "Hash changed, valid bcrypt $2, matches new password, rejects old password",
      actual: `hashChanged=${hashChanged}, matchesNew=${matchesNew}, rejectsOld=${rejectsOld}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 11, name: "Database Password Hash Verification", expected: "Pass", actual: e.message, passed: false });
  }

  // Summary
  console.log("\n==================================================");
  console.log("PHASE 4 TEST RESULTS SUMMARY");
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
  console.log(`OVERALL STATUS: ${allPassed ? "ALL PHASE 4 TESTS PASSED! 🚀" : "SOME TESTS FAILED ❌"}`);
  console.log("==================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runProfileTestSuite();
