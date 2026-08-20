import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "./models/User";

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

// Authentication Middleware (verifies JWT Bearer token)
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found or account no longer exists",
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// 404 Handler for unknown routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
};

// Global Error Handler
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error("Unhandled Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
