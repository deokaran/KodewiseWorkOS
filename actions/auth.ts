"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}

import { getSessionUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { EmailService } from "@/services/EmailService";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function getCurrentUserAction() {
  try {
    const user = await getSessionUser();
    return { success: true as const, data: user };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to get session user" };
  }
}

export async function requestPasswordResetOtpAction(email: string) {
  try {
    if (!email || typeof email !== "string") {
      return { success: false as const, error: "Please provide a valid email address." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false as const, error: "Please enter a valid email format." };
    }

    // Check if a user exists with this primary or personal email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: "insensitive" } },
          { personalEmail: { equals: normalizedEmail, mode: "insensitive" } },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      return {
        success: false as const,
        error: "No account registered with this email address.",
      };
    }

    // Invalidate/delete any previous active OTPs for this email
    await prisma.passwordResetOtp.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.passwordResetOtp.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt,
        used: false,
      },
    });

    // Send OTP email
    const targetEmail = user.email || normalizedEmail;
    await EmailService.sendPasswordResetOtp({
      recipientEmail: targetEmail,
      recipientName: user.name,
      otp,
      expiresInMinutes: 10,
    });

    return {
      success: true as const,
      message: "A 6-digit verification code has been sent to your email address.",
    };
  } catch (error: any) {
    console.error("Error in requestPasswordResetOtpAction:", error);
    return {
      success: false as const,
      error: error.message || "Failed to send verification code. Please try again.",
    };
  }
}

export async function verifyPasswordResetOtpAction(email: string, otp: string) {
  try {
    if (!email || !otp) {
      return { success: false as const, error: "Email and verification code are required." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        otp: trimmedOtp,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return {
        success: false as const,
        error: "Invalid or expired verification code. Please request a new code.",
      };
    }

    return { success: true as const, message: "Code verified successfully." };
  } catch (error: any) {
    console.error("Error in verifyPasswordResetOtpAction:", error);
    return {
      success: false as const,
      error: error.message || "Failed to verify code.",
    };
  }
}

export async function resetPasswordWithOtpAction(
  email: string,
  otp: string,
  newPassword: string,
  confirmPassword?: string
) {
  try {
    if (!email || !otp || !newPassword) {
      return {
        success: false as const,
        error: "All fields are required.",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false as const,
        error: "Password must be at least 6 characters in length.",
      };
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return {
        success: false as const,
        error: "New password and confirmation password do not match.",
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    // Verify OTP validity
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        otp: trimmedOtp,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return {
        success: false as const,
        error: "Invalid or expired verification code. Please request a new code.",
      };
    }

    // Find the user to update
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: "insensitive" } },
          { personalEmail: { equals: normalizedEmail, mode: "insensitive" } },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      return {
        success: false as const,
        error: "User account not found.",
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atomically update user password & clean up OTPs
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOtp.deleteMany({
        where: { email: normalizedEmail },
      }),
    ]);

    // Send confirmation security email
    try {
      await EmailService.sendPasswordResetConfirmation({
        recipientEmail: user.email,
        recipientName: user.name,
      });
    } catch (emailErr) {
      console.warn("Failed to send password reset confirmation email:", emailErr);
    }

    return {
      success: true as const,
      message: "Password reset successful! You can now log in with your new password.",
    };
  } catch (error: any) {
    console.error("Error in resetPasswordWithOtpAction:", error);
    return {
      success: false as const,
      error: error.message || "Failed to reset password. Please try again.",
    };
  }
}

