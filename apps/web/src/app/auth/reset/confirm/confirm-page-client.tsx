"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordResetConfirm, AuthLayout } from "@repo/ui/auth";

export function PasswordResetConfirmPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Extract tokens from URL hash or query params
  useEffect(() => {
    // Check URL hash first (common for auth redirects)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    // Check query params as backup
    const queryParams = searchParams;

    const access_token =
      hashParams.get("access_token") || queryParams?.get("access_token");
    const refresh_token =
      hashParams.get("refresh_token") || queryParams?.get("refresh_token");

    if (access_token && refresh_token) {
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
    }
  }, [searchParams]);

  const handleSuccess = () => {
    // Redirect to login page with success message
    router.push(
      "/auth/login?message=" +
        encodeURIComponent(
          "Password reset successful! You can now sign in with your new password."
        )
    );
  };

  const handleError = (error: string) => {
    console.error("Password reset error:", error);
    // Could redirect to error page or show error message
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
      showLogo={true}
    >
      <div className="space-y-6">
        <PasswordResetConfirm
          accessToken={accessToken || undefined}
          refreshToken={refreshToken || undefined}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {/* Help text */}
        <div className="text-center">
          <div className="text-sm text-gray-600">
            <p>
              Having trouble?{" "}
              <a
                href="/auth/reset"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Request a new reset link
              </a>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to sign in
            </a>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
