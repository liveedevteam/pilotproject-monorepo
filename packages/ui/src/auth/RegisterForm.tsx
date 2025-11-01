"use client";

import React, { useState } from "react";
import { FormInput } from "./FormInput";
import { PasswordInput } from "./PasswordInput";
import { useAuth } from "./AuthProvider";
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
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  className,
  onSuccess,
  onError,
}) => {
  const { signUp, isLoading } = useAuth();
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
      await signUp(formData.email, formData.password, {
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
      });

      onSuccess?.();
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
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Fill in your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.general && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
              "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              "disabled:bg-gray-400 disabled:cursor-not-allowed",
              "transition-colors duration-200"
            )}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                disabled={isFormDisabled}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export { RegisterForm };
