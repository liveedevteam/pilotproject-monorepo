/**
 * AUTH-006 Form Testing Component
 *
 * This component demonstrates and tests all the authentication forms
 * created for AUTH-006: Registration and Login Forms
 *
 * Usage:
 * - Import this component in your Next.js app for testing
 * - All forms are wrapped with AuthProvider for context
 * - Test different states and scenarios
 */

"use client";

import React, { useState } from "react";
import { AuthProvider } from "./AuthProvider";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { AuthLayout } from "./AuthLayout";

type FormMode = "login" | "register" | "forgot";

const AuthFormsTest: React.FC = () => {
  const [mode, setMode] = useState<FormMode>("login");
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [
      ...prev,
      `[${timestamp}] ${type.toUpperCase()}: ${message}`,
    ]);
  };

  const handleSuccess = () => {
    addMessage("Authentication successful!", "success");
  };

  const handleError = (error: string) => {
    addMessage(`Authentication failed: ${error}`, "error");
  };

  const handleForgotPassword = () => {
    setMode("forgot");
    addMessage(
      "Forgot password clicked - would redirect to password reset",
      "success"
    );
  };

  const renderForm = () => {
    switch (mode) {
      case "login":
        return (
          <LoginForm
            onSuccess={handleSuccess}
            onError={handleError}
            onForgotPassword={handleForgotPassword}
            onSignUp={() => setMode("register")}
          />
        );
      case "register":
        return <RegisterForm onSuccess={handleSuccess} onError={handleError} />;
      case "forgot":
        return (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Password Reset</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Password reset form would be implemented here
            </p>
            <button
              onClick={() => setMode("login")}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Back to login
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            AUTH-006 Form Testing Dashboard
          </h1>

          {/* Mode Switcher */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setMode("login")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                mode === "login"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Login Form
            </button>
            <button
              onClick={() => setMode("register")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                mode === "register"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Register Form
            </button>
            <button
              onClick={() => setMessages([])}
              className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            >
              Clear Messages
            </button>
          </div>

          {/* Messages Log */}
          {messages.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Test Results:
              </h4>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`text-xs font-mono ${
                    message.includes("ERROR")
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Display */}
      <AuthProvider>
        <AuthLayout
          title={
            mode === "login"
              ? "Sign in to your account"
              : mode === "register"
                ? "Create your account"
                : "Reset your password"
          }
          subtitle={
            mode === "login"
              ? "Enter your credentials to access your account"
              : mode === "register"
                ? "Fill in your details to get started"
                : "We'll send you a reset link"
          }
        >
          {renderForm()}
        </AuthLayout>
      </AuthProvider>

      {/* Test Information */}
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 m-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          AUTH-006 Implementation Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
              ✅ Completed Features
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Reusable FormInput component with validation</li>
              <li>• PasswordInput with strength meter</li>
              <li>• Registration form with field validation</li>
              <li>• Login form with error handling</li>
              <li>• Mobile responsive design</li>
              <li>• Loading states and user feedback</li>
              <li>• Accessible form components (ARIA labels)</li>
              <li>• Integration with AuthProvider context</li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
              📋 Form Validation Rules
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Email: Valid format, required</li>
              <li>
                • Password: 8+ chars, uppercase, lowercase, number, special
              </li>
              <li>• Names: Optional, max 100 characters</li>
              <li>• Real-time validation feedback</li>
              <li>• Clear error messages</li>
              <li>• Password confirmation matching</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Test Instructions:
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>
              1. Try filling out forms with invalid data to test validation
            </li>
            <li>
              2. Test password strength meter with different password
              combinations
            </li>
            <li>
              3. Test form submission (will show success/error messages above)
            </li>
            <li>4. Check responsive behavior by resizing browser window</li>
            <li>5. Test accessibility with keyboard navigation</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AuthFormsTest;
