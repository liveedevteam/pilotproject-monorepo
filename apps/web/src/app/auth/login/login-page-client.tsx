"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LoginForm,
  AuthLayout,
  EnhancedAuthGuard,
  useAuth,
} from "@repo/ui/auth";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get redirect URL from query params
  const redirectTo = searchParams?.get("redirect") || "/dashboard";
  const message = searchParams?.get("message");
  const verified = searchParams?.get("verified");

  // Handle successful verification
  useEffect(() => {
    if (verified === "true") {
      setSuccess("Email verified successfully! You can now sign in.");
    }
    if (message) {
      setSuccess(decodeURIComponent(message));
    }
  }, [verified, message]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const handleLogin = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // The LoginForm handles the actual login through the auth context
      // After successful login, the user will be redirected by the useEffect above
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // LoginForm will trigger auth context update, which will trigger redirect
    router.push(redirectTo);
  };

  const handleLoginError = (error: string) => {
    setError(error);
  };

  return (
    // Only show login page to unauthenticated users
    <EnhancedAuthGuard requireAuth={false} fallback={null}>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your account to continue"
        showLogo={true}
      >
        <div className="space-y-6">
          {/* Success message */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <LoginForm
            onSubmit={handleLogin}
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            isLoading={isLoading}
            showRememberMe={true}
            showForgotPassword={true}
          />

          {/* Additional links */}
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href={`/auth/register${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/reset"
                className="text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
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
    </EnhancedAuthGuard>
  );
}
