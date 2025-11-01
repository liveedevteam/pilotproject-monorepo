"use client";

import React, { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@repo/database/browser";
import { Button } from "../components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card";
import { Alert, AlertDescription } from "../components/alert";
import { CheckCircle, Mail, RefreshCw, AlertCircle } from "lucide-react";

interface EmailVerificationProps {
  email?: string;
  onVerified?: () => void;
  className?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerified,
  className = "",
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const supabase = createBrowserSupabaseClient();

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkVerificationStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        setIsVerified(true);
        onVerified?.();
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  const handleResendVerification = async () => {
    if (!email || countdown > 0) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        throw resendError;
      }

      setResendSuccess(true);
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to resend verification email"
      );
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-700">Email Verified!</CardTitle>
          <CardDescription>
            Your email address has been successfully verified.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification link to{" "}
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center text-sm text-gray-600">
          <p>Click the link in the email to verify your account.</p>
          <p className="mt-2">
            Didn't receive the email? Check your spam folder.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Verification email sent successfully! Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResendVerification}
            disabled={isResending || countdown > 0 || !email}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            onClick={checkVerificationStatus}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Verification Status
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>The verification link will expire in 24 hours.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailVerification;
