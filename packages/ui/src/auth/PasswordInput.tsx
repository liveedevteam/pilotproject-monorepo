"use client";

import React, { forwardRef, useState, useMemo } from "react";
import { cn } from "../lib/utils";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrengthMeter?: boolean;
  minLength?: number;
  label?: string;
  error?: string;
  hint?: string;
  isRequired?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showStrengthMeter = false,
      minLength = 8,
      value = "",
      onChange,
      label,
      error,
      hint,
      isRequired,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const password = typeof value === "string" ? value : "";

    const passwordStrength = useMemo((): PasswordStrength => {
      const requirements = {
        length: password.length >= minLength,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };

      const score = Object.values(requirements).filter(Boolean).length;

      let label = "";
      let color = "";

      if (score === 0) {
        label = "";
        color = "";
      } else if (score <= 2) {
        label = "Weak";
        color = "bg-red-500";
      } else if (score <= 3) {
        label = "Fair";
        color = "bg-yellow-500";
      } else if (score <= 4) {
        label = "Good";
        color = "bg-blue-500";
      } else {
        label = "Strong";
        color = "bg-green-500";
      }

      return { score, label, color, requirements };
    }, [password, minLength]);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="space-y-2 sm:space-y-3 animate-fade-in-up">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          {/* Lock icon on the left */}
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300"
              fill="none"
              strokeWidth={1.5}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <input
            {...props}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            ref={ref}
            className={cn(
              "flex h-11 sm:h-12 w-full rounded-xl border-2 bg-white dark:bg-gray-800 pl-10 sm:pl-11 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm font-medium",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "border-gray-200 dark:border-gray-700",
              "focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900",
              "transition-all duration-300",
              "hover:border-gray-300 dark:hover:border-gray-600",
              {
                "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30":
                  error,
              },
              className
            )}
            aria-invalid={error ? "true" : "false"}
          />

          {/* Eye icon on the right */}
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 z-10 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p
            className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in"
            role="alert"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {showStrengthMeter && password && (
          <div className="space-y-2">
            {/* Strength Meter */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div
                  className={cn(
                    "h-1.5 sm:h-2 rounded-full transition-all duration-300",
                    passwordStrength.color
                  )}
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                  }}
                />
              </div>
              {passwordStrength.label && (
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[50px] sm:min-w-[60px]">
                  {passwordStrength.label}
                </span>
              )}
            </div>

            {/* Requirements */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Password requirements:
              </p>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <RequirementItem
                  met={passwordStrength.requirements.length}
                  text={`At least ${minLength} characters`}
                />
                <RequirementItem
                  met={passwordStrength.requirements.uppercase}
                  text="One uppercase letter"
                />
                <RequirementItem
                  met={passwordStrength.requirements.lowercase}
                  text="One lowercase letter"
                />
                <RequirementItem
                  met={passwordStrength.requirements.number}
                  text="One number"
                />
                <RequirementItem
                  met={passwordStrength.requirements.special}
                  text="One special character"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({
  met,
  text,
}) => (
  <div className="flex items-center space-x-2">
    <div
      className={cn(
        "h-3 w-3 rounded-full flex items-center justify-center",
        met ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      )}
    >
      {met && (
        <svg
          className="h-2 w-2 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
    <span
      className={cn(
        "text-xs",
        met
          ? "text-green-600 dark:text-green-400"
          : "text-gray-500 dark:text-gray-400"
      )}
    >
      {text}
    </span>
  </div>
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
