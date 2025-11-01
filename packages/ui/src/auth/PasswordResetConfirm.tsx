"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrowserSupabaseClient } from "@repo/database";
import { Button } from "../components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card";
import { Alert, AlertDescription } from "../components/alert";
import { PasswordInput } from "./PasswordInput";
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

interface PasswordResetConfirmProps {
  accessToken?: string;
  refreshToken?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const PasswordResetConfirm: React.FC<PasswordResetConfirmProps> = ({
  accessToken,
  refreshToken,
  onSuccess,
  onError,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const password = watch("password");

  // Verify session on mount
  useEffect(() => {
    verifyResetSession();
  }, [accessToken, refreshToken]);

  const verifyResetSession = async () => {
    try {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          throw error;
        }

        setSessionValid(true);
      } else {
        // Check if user came from a reset link
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setSessionValid(false);
          setError(
            "Invalid or expired reset link. Please request a new password reset."
          );
          return;
        }

        setSessionValid(true);
      }
    } catch (error) {
      setSessionValid(false);
      setError(
        error instanceof Error
          ? error.message
          : "Invalid or expired reset link. Please request a new password reset."
      );
      onError?.(
        error instanceof Error ? error.message : "Session verification failed"
      );
    }
  };

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    if (strength <= 2) {
      return { strength, label: "Weak", color: "bg-red-500" };
    } else if (strength <= 3) {
      return { strength, label: "Fair", color: "bg-yellow-500" };
    } else if (strength <= 4) {
      return { strength, label: "Good", color: "bg-blue-500" };
    } else {
      return { strength, label: "Strong", color: "bg-green-500" };
    }
  };

  // Show loading state while verifying session
  if (sessionValid === null) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if session is invalid
  if (sessionValid === false) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-700">Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="mt-4">
            <Button
              onClick={() => (window.location.href = "/auth/reset-password")}
              variant="outline"
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show success state
  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-700">
            Password Reset Successful
          </CardTitle>
          <CardDescription>
            Your password has been successfully updated.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            onClick={() => (window.location.href = "/auth/login")}
            className="w-full"
          >
            Continue to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const passwordStrength = getPasswordStrength(password || "");

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it's strong and secure.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <PasswordInput
              label="New Password"
              placeholder="Enter your new password"
              error={errors.password?.message}
              {...register("password")}
              autoFocus
            />

            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Password strength</span>
                  <span
                    className={`font-medium ${
                      passwordStrength.strength <= 2
                        ? "text-red-600"
                        : passwordStrength.strength <= 3
                          ? "text-yellow-600"
                          : passwordStrength.strength <= 4
                            ? "text-blue-600"
                            : "text-green-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i <= passwordStrength.strength
                          ? passwordStrength.color
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          <h4 className="font-medium mb-2">Password Requirements:</h4>
          <ul className="space-y-1">
            <li className="flex items-center">
              <div
                className={`w-1.5 h-1.5 rounded-full mr-2 ${password?.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
              />
              At least 8 characters
            </li>
            <li className="flex items-center">
              <div
                className={`w-1.5 h-1.5 rounded-full mr-2 ${/[A-Z]/.test(password || "") ? "bg-green-500" : "bg-gray-300"}`}
              />
              One uppercase letter
            </li>
            <li className="flex items-center">
              <div
                className={`w-1.5 h-1.5 rounded-full mr-2 ${/[a-z]/.test(password || "") ? "bg-green-500" : "bg-gray-300"}`}
              />
              One lowercase letter
            </li>
            <li className="flex items-center">
              <div
                className={`w-1.5 h-1.5 rounded-full mr-2 ${/[0-9]/.test(password || "") ? "bg-green-500" : "bg-gray-300"}`}
              />
              One number
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordResetConfirm;
