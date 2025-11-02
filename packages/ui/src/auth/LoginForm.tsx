"use client";

import React, { useState } from "react";
import { FormInput } from "./FormInput";
import { PasswordInput } from "./PasswordInput";
import { useAuth } from "./EnhancedAuthProvider";
import { cn } from "../lib/utils";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface LoginFormProps {
  className?: string;
  onSubmit?: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  isLoading?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  className,
  onSubmit,
  onSuccess,
  onError,
  onForgotPassword,
  onSignUp,
  isLoading: externalIsLoading,
  showRememberMe = true,
  showForgotPassword = true,
}) => {
  const { signIn, isLoading: authLoading } = useAuth();
  const isLoading = externalIsLoading || authLoading;
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "rememberMe" ? e.target.checked : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field as keyof FormErrors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }

      // Clear general error
      if (errors.general) {
        setErrors(prev => ({ ...prev, general: undefined }));
      }
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // If external onSubmit provided, use it instead of default auth flow
      if (onSubmit) {
        await onSubmit();
      } else {
        await signIn(formData.email, formData.password);

        // Handle remember me functionality if needed
        if (formData.rememberMe) {
          localStorage.setItem("auth_remember_me", "true");
        } else {
          localStorage.removeItem("auth_remember_me");
        }
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";

      // Handle specific error cases
      let displayMessage = errorMessage;
      if (errorMessage.includes("Invalid login credentials")) {
        displayMessage = "Invalid email or password. Please try again.";
      } else if (errorMessage.includes("Email not confirmed")) {
        displayMessage =
          "Please check your email and click the verification link before signing in.";
      } else if (errorMessage.includes("Too many requests")) {
        displayMessage = "Too many login attempts. Please try again later.";
      }

      setErrors({ general: displayMessage });
      onError?.(displayMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {errors.general && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 animate-fade-in">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        <FormInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          error={errors.email}
          placeholder="john@example.com"
          isRequired
          disabled={isFormDisabled}
          autoComplete="email"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              strokeWidth={1.5}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0021.75 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          }
        />

        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={handleInputChange("password")}
          error={errors.password}
          placeholder="Enter your password"
          isRequired
          disabled={isFormDisabled}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm">
          {showRememberMe && (
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange("rememberMe")}
                disabled={isFormDisabled}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-gray-700 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>
          )}

          {showForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isFormDisabled}
              className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
            >
              Forgot password?
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isFormDisabled}
          className={cn(
            "group relative w-full flex justify-center items-center gap-2 py-3.5 px-4",
            "rounded-xl font-semibold text-white shadow-lg",
            "bg-gradient-to-r from-blue-600 to-purple-600",
            "hover:from-blue-700 hover:to-purple-700",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400",
            "transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl",
            "animate-fade-in-up animation-delay-400"
          )}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>

        <div className="text-center animate-fade-in-up animation-delay-400">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSignUp}
              disabled={isFormDisabled}
              className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
            >
              Create account
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export { LoginForm };
