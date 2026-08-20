import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware";

const router = Router();

// ============================================================================
// GET /api/users/profile (Protected)
// ============================================================================
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving user profile",
    });
  }
});

// ============================================================================
// PUT /api/users/profile (Protected)
// ============================================================================
router.put("/profile", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const { name } = req.body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Name is required and cannot be empty",
      });
      return;
    }

    const trimmedName = name.trim();

    // Update only allowed fields (name) - prevent changing email, role, or password
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.name = trimmedName;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error updating profile",
    });
  }
});

// ============================================================================
// PUT /api/users/change-password (Protected)
// ============================================================================
router.put("/change-password", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // 1. Validation
    if (!currentPassword || typeof currentPassword !== "string" || currentPassword.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Current password is required",
      });
      return;
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
      return;
    }

    // 2. Find user including password hash
    const user = await User.findById(req.user.id);
    if (!user || !user.password) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // 3. Verify current password
    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    // 4. Reject same password
    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
      return;
    }

    const isSameAsHashed = await bcrypt.compare(newPassword, user.password);
    if (isSameAsHashed) {
      res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
      return;
    }

    // 5. Hash new password with bcryptjs (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    await user.save();

    // 6. Return success response (never return password)
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error changing password",
    });
  }
});

export default router;
