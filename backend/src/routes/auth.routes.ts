import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware";

const router = Router();

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// POST /api/auth/register
// ============================================================================
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Name is required",
      });
      return;
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
      return;
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    // 2. Normalize email and name
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    // 3. Duplicate email check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    // 4. Password hashing with bcryptjs (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user (forced role "user" to prevent unauthorized admin creation)
    const newUser = new User({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    await newUser.save();

    // 6. Return safe user data
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

// ============================================================================
// POST /api/auth/login
// ============================================================================
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Validate email & password presence
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // 4. Generate JWT
    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      jwtSecret,
      {
        expiresIn: expiresIn ?? "7d",
      }
    );

    // 5. Return token and safe user info
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// ============================================================================
// GET /api/auth/me (Protected)
// ============================================================================
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication token required",
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ============================================================================
// POST /api/auth/logout
// ============================================================================
router.post("/logout", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
