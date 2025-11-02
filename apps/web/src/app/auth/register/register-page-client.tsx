"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RegisterForm,
  AuthLayout,
  EnhancedAuthGuard,
  useAuth,
  EmailVerification,
} from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { AlertCircle, CheckCircle } from "lucide-react";

export function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  // Get redirect URL from query params
  const redirectTo = searchParams?.get("redirect") || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const handleRegister = async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    acceptTerms?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // The RegisterForm handles the actual registration through the auth context
      setRegisteredEmail(data.email);
      setShowVerification(true);
      setSuccess(
        "Account created successfully! Please check your email to verify your account."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = (email: string) => {
    setRegisteredEmail(email);
    setShowVerification(true);
    setSuccess(
      "Account created successfully! Please check your email to verify your account."
    );
  };

  const handleRegisterError = (error: string) => {
    setError(error);
  };

  const handleVerificationComplete = () => {
    // Redirect to login page with success message
    router.push(
      `/auth/login?verified=true&redirect=${encodeURIComponent(redirectTo)}`
    );
  };

  return (
    // Only show register page to unauthenticated users
    <EnhancedAuthGuard requireAuth={false} fallback={null}>
      <AuthLayout
        title={showVerification ? "Check your email" : "Create your account"}
        subtitle={
          showVerification
            ? "We've sent you a verification link"
            : "Sign up to get started with our platform"
        }
        showLogo={true}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Success message */}
          {success && (
            <Alert className="animate-fade-in">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Show email verification component or register form */}
          {showVerification ? (
            <EmailVerification
              email={registeredEmail}
              onVerified={handleVerificationComplete}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              onSuccess={handleRegisterSuccess}
              onError={handleRegisterError}
              isLoading={isLoading}
              showTermsAcceptance={true}
              termsUrl="/terms"
              privacyUrl="/privacy"
            />
          )}

          {/* Links for verification screen */}
          {showVerification && (
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm">
                <button
                  onClick={() => {
                    setShowVerification(false);
                    setRegisteredEmail("");
                    setSuccess(null);
                  }}
                  className="text-blue-600 hover:text-blue-500 min-h-11 inline-flex items-center touch-manipulation transition-colors"
                >
                  ← Back to registration
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-600">
                Already verified?{" "}
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-blue-600 hover:text-blue-500 min-h-11 inline-flex items-center touch-manipulation transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </AuthLayout>
    </EnhancedAuthGuard>
  );
}
