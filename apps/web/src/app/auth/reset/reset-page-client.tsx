"use client";

import React from "react";
import Link from "next/link";
import { PasswordResetRequest, AuthLayout } from "@repo/ui";

export function PasswordResetPageClient() {
  const handleBackToLogin = () => {
    // Navigation is handled by the PasswordResetRequest component
  };

  // Safe way to get the origin for SSR
  const getResetConfirmUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth/reset/confirm`;
    }
    return "/auth/reset/confirm"; // Fallback for SSR
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link"
      showLogo={true}
    >
      <div className="space-y-6">
        <PasswordResetRequest
          onBack={handleBackToLogin}
          redirectTo={getResetConfirmUrl()}
        />

        {/* Additional help */}
        <div className="text-center">
          <div className="text-sm text-gray-600">
            <p>
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
