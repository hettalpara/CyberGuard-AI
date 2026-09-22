import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import authRoutes from "../src/routes/auth.routes";
import userRoutes from "../src/routes/user.routes";
import { notFoundHandler, errorHandler } from "../src/middleware";
import { User } from "../src/models/User";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

describe("Authentication and User Routes", () => {
  const JWT_SECRET = "test_secret_for_auth_suite";

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("successfully registers a new user with hashed password", async () => {
      const mockSavedUser = {
        _id: new Types.ObjectId(),
        name: "Alice Defender",
        email: "alice@cyberguard.test",
        role: "user",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findOne").mockResolvedValue(null);
      vi.spyOn(User.prototype, "save").mockImplementation(async function () {
        return mockSavedUser as any;
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Alice Defender",
          email: "alice@cyberguard.test",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("successful");
      expect(res.body.user.email).toBe("alice@cyberguard.test");
      expect(res.body.user.role).toBe("user");
      expect(res.body.user.password).toBeUndefined();
    });

    it("rejects registration when email format is invalid", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Invalid Email User",
          email: "not-an-email",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("valid email");
    });

    it("rejects registration when password is less than 8 characters", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Short Pass",
          email: "valid@cyberguard.test",
          password: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("8 characters");
    });

    it("rejects registration when name is missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "",
          email: "valid@cyberguard.test",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Name is required");
    });

    it("rejects registration when email already exists (409 Conflict)", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
        email: "existing@cyberguard.test",
      } as any);

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Duplicate User",
          email: "existing@cyberguard.test",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already registered");
    });
  });

  describe("POST /api/auth/login", () => {
    it("successfully logs in with valid credentials and returns JWT token", async () => {
      const hashedPassword = await bcrypt.hash("CorrectPassword123!", 10);
      const mockUserId = new Types.ObjectId();

      vi.spyOn(User, "findOne").mockResolvedValue({
        _id: mockUserId,
        name: "Alice Defender",
        email: "alice@cyberguard.test",
        password: hashedPassword,
        role: "user",
      } as any);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "alice@cyberguard.test",
          password: "CorrectPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("alice@cyberguard.test");

      // Verify token
      const decoded: any = jwt.verify(res.body.token, JWT_SECRET);
      expect(decoded.userId).toBe(mockUserId.toString());
    });

    it("rejects login when password is incorrect", async () => {
      const hashedPassword = await bcrypt.hash("CorrectPassword123!", 10);

      vi.spyOn(User, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
        email: "alice@cyberguard.test",
        password: hashedPassword,
      } as any);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "alice@cyberguard.test",
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("rejects login when user does not exist", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@cyberguard.test",
          password: "AnyPassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid email or password");
    });
  });

  describe("Protected Routes & Token Middleware", () => {
    it("rejects access when Authorization header is missing", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Authentication token required");
    });

    it("rejects access when Authorization token is invalid or malformed", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-string");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid or expired token");
    });

    it("grants access to /api/auth/me when token is valid and user exists", async () => {
      const userId = new Types.ObjectId();
      const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: "1h" });

      vi.spyOn(User, "findById").mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          name: "Alice Defender",
          email: "alice@cyberguard.test",
          role: "user",
        }),
      } as any);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(userId.toString());
      expect(res.body.user.email).toBe("alice@cyberguard.test");
    });

    it("retrieves user profile via GET /api/users/profile", async () => {
      const userId = new Types.ObjectId();
      const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: "1h" });

      vi.spyOn(User, "findById").mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          name: "Alice Defender",
          email: "alice@cyberguard.test",
          role: "user",
          createdAt: new Date(),
        }),
      } as any);

      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe("Alice Defender");
    });

    it("changes password via PUT /api/users/change-password with correct current password", async () => {
      const userId = new Types.ObjectId();
      const currentPasswordHash = await bcrypt.hash("OldPassword123!", 10);
      const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: "1h" });

      const mockUserDoc = {
        _id: userId,
        name: "Alice",
        email: "alice@cyberguard.test",
        role: "user",
        password: currentPasswordHash,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findById").mockImplementation(((id: any) => {
        return {
          select: vi.fn().mockResolvedValue(mockUserDoc),
          then: (cb: any) => Promise.resolve(mockUserDoc).then(cb),
        };
      }) as any);

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "BrandNewPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("successfully");
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it("rejects password change when current password is wrong", async () => {
      const userId = new Types.ObjectId();
      const currentPasswordHash = await bcrypt.hash("OldPassword123!", 10);
      const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: "1h" });

      const mockUserDoc = {
        _id: userId,
        password: currentPasswordHash,
        save: vi.fn(),
      };

      vi.spyOn(User, "findById").mockImplementation(((id: any) => {
        return {
          select: vi.fn().mockResolvedValue(mockUserDoc),
          then: (cb: any) => Promise.resolve(mockUserDoc).then(cb),
        };
      }) as any);

      const res = await request(app)
        .put("/api/users/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongCurrentPassword!",
          newPassword: "BrandNewPassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Current password is incorrect");
    });
  });
});
