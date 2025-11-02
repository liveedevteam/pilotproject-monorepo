"use client";

import React, { forwardRef } from "react";
import { cn } from "../lib/utils";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  isRequired?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      hint,
      icon,
      isRequired = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

    return (
      <div className="space-y-2 animate-fade-in-up">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
              <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300">
                {icon}
              </div>
            </div>
          )}

          <input
            type={type}
            id={inputId}
            ref={ref}
            className={cn(
              "flex h-11 sm:h-12 w-full rounded-xl border-2 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "border-gray-200 dark:border-gray-700",
              "focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900",
              "transition-all duration-300",
              "hover:border-gray-300 dark:hover:border-gray-600",
              {
                "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30":
                  error,
                "pl-10 sm:pl-11": icon,
              },
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
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

        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };
