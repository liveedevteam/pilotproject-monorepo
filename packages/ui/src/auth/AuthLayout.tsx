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
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
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

      {/* Decorative background elements - hidden on mobile for performance */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        {/* Logo */}
        {showLogo && (
          <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in">
            <div className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
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
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MyApp
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-6 sm:mb-8 px-4 animate-fade-in-up">
            {title && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2 sm:mb-3">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl animate-fade-in-up animation-delay-200">
        <div
          className={cn(
            "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl",
            "py-6 px-4 sm:py-8 sm:px-8 md:py-10 md:px-10 lg:px-12",
            "shadow-2xl rounded-xl sm:rounded-2xl",
            "border border-gray-200/50 dark:border-gray-700/50",
            "transform transition-all duration-300 hover:shadow-3xl",
            className
          )}
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 sm:mt-8 text-center animate-fade-in animation-delay-400">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          &copy; 2024 MyApp. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export { AuthLayout };
