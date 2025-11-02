"use client";

import React, { useState } from "react";
import { FormInput } from "./FormInput";
import { PasswordInput } from "./PasswordInput";
import { useAuth } from "./EnhancedAuthProvider";
import { cn } from "../lib/utils";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

export interface RegisterFormProps {
  className?: string;
  onSubmit?: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    acceptTerms?: boolean;
  }) => Promise<void>;
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  showTermsAcceptance?: boolean;
  termsUrl?: string;
  privacyUrl?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  className,
  onSubmit,
  onSuccess,
  onError,
  isLoading: externalIsLoading,
  showTermsAcceptance = true,
  termsUrl = "/terms",
  privacyUrl = "/privacy",
}) => {
  const { signUp, isLoading: authLoading } = useAuth();
  const isLoading = externalIsLoading || authLoading;
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
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
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(password))
      return "Password must contain a lowercase letter";
    if (!/\d/.test(password)) return "Password must contain a number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must contain a special character";
    return undefined;
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): string | undefined => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );

    // Optional field validation
    if (formData.firstName && formData.firstName.length > 100) {
      newErrors.firstName = "First name must be less than 100 characters";
    }
    if (formData.lastName && formData.lastName.length > 100) {
      newErrors.lastName = "Last name must be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
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
        await onSubmit({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          acceptTerms: true, // Assuming form validation ensures this
        });
      } else {
        await signUp(formData.email, formData.password, {
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
        });
      }

      onSuccess?.(formData.email);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-5"
        noValidate
      >
        {errors.general && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 border border-red-200 dark:border-red-800 animate-fade-in">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
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
                <p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <FormInput
            label="First Name"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange("firstName")}
            error={errors.firstName}
            placeholder="John"
            disabled={isFormDisabled}
            autoComplete="given-name"
          />

          <FormInput
            label="Last Name"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange("lastName")}
            error={errors.lastName}
            placeholder="Doe"
            disabled={isFormDisabled}
            autoComplete="family-name"
          />
        </div>

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
          placeholder="Create a strong password"
          isRequired
          disabled={isFormDisabled}
          autoComplete="new-password"
          showStrengthMeter
        />

        <PasswordInput
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          error={errors.confirmPassword}
          placeholder="Confirm your password"
          isRequired
          disabled={isFormDisabled}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isFormDisabled}
          className={cn(
            "group relative w-full flex justify-center items-center gap-2",
            "py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base text-white shadow-lg",
            "bg-gradient-to-r from-blue-600 to-purple-600",
            "hover:from-blue-700 hover:to-purple-700",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400",
            "transition-all duration-300 transform active:scale-[0.98] hover:scale-[1.02] hover:shadow-xl",
            "animate-fade-in-up animation-delay-400",
            // Better touch target for mobile
            "min-h-11 touch-manipulation"
          )}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
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
              <span className="text-sm sm:text-base">Creating account...</span>
            </>
          ) : (
            <>
              <span className="text-sm sm:text-base">Create account</span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1"
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
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 min-h-11 inline-flex items-center touch-manipulation"
              disabled={isFormDisabled}
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export { RegisterForm };
