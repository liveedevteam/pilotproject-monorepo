"use client";

import React, { forwardRef, useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import { FormInput, FormInputProps } from "./FormInput";

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

export interface PasswordInputProps extends Omit<FormInputProps, "type"> {
  showStrengthMeter?: boolean;
  minLength?: number;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showStrengthMeter = false,
      minLength = 8,
      value = "",
      onChange,
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

    const eyeIcon = (
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 z-10"
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>
    );

    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="relative">
          <FormInput
            {...props}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            ref={ref}
            className={cn("pr-10 sm:pr-12", props.className)}
          />
          {eyeIcon}
        </div>

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
