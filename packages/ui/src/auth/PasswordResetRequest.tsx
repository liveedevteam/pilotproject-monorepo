"use client";

import React, { useState } from "react";
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
import { FormInput } from "./FormInput";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

const resetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetRequestFormData = z.infer<typeof resetRequestSchema>;

interface PasswordResetRequestProps {
  onBack?: () => void;
  redirectTo?: string;
  className?: string;
}

export const PasswordResetRequest: React.FC<PasswordResetRequestProps> = ({
  onBack,
  redirectTo,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
  });

  const onSubmit = async (data: ResetRequestFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const resetUrl =
        redirectTo || `${window.location.origin}/auth/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: resetUrl,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to send reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-700">Reset Email Sent</CardTitle>
          <CardDescription>
            We've sent password reset instructions to{" "}
            <span className="font-medium">{submittedEmail}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              Check your email and click the reset link to create a new
              password.
            </p>
            <p className="mt-2">The link will expire in 1 hour.</p>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Didn't receive the email? Check your spam folder or try again with
              a different email address.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={() => {
                setIsSuccess(false);
                setSubmittedEmail("");
                setError(null);
              }}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send to Different Email
            </Button>

            {onBack && (
              <Button onClick={onBack} variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
            autoFocus
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Reset Email...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Email
                </>
              )}
            </Button>

            {onBack && (
              <Button
                type="button"
                onClick={onBack}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            Remember your password?{" "}
            <button
              type="button"
              onClick={onBack}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordResetRequest;
