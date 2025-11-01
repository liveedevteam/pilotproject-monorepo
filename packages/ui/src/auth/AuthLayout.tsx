"use client";

import React from "react";
import { cn } from "../lib/utils";

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  showLogo?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  className,
  title,
  subtitle,
  backgroundImage,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 dark:bg-gray-900 py-12 sm:px-6 lg:px-8">
      {/* Background Image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gray-900/50" />
        </div>
      )}

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        {showLogo && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                MyApp
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className={cn(
            "bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10",
            "border border-gray-200 dark:border-gray-700",
            className
          )}
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          &copy; 2024 MyApp. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export { AuthLayout };
