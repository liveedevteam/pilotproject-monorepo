"use client";

import Link from "next/link";
import { useAuth } from "@repo/ui";
import { Button } from "@repo/ui";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Authentication Demo
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Test the complete authentication user journey from registration to
            protected routes.
          </p>

          {isAuthenticated ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-green-800 mb-4">
                  ✅ You are signed in!
                </h2>
                <p className="text-gray-600 mb-4">
                  Welcome back, {user?.profile?.firstName || user?.email}
                </p>
                <div className="space-y-3">
                  <Link href="/dashboard">
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                  <Link href="/auth/profile">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Get Started
                </h2>
                <p className="text-gray-600 mb-6">
                  Sign up or log in to test the authentication system
                </p>
                <div className="space-y-3">
                  <Link href="/auth/register">
                    <Button className="w-full">Create Account</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🔐 User Registration
              </h3>
              <p className="text-gray-600 text-sm">
                Test account creation with email verification flow
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ✉️ Email Verification
              </h3>
              <p className="text-gray-600 text-sm">
                Verify emails using local Mailpit server (port 54581)
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🛡️ Protected Routes
              </h3>
              <p className="text-gray-600 text-sm">
                Access dashboard and profile pages after authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
