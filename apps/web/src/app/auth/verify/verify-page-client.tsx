"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmailVerification, AuthLayout } from "@repo/ui/auth";

export function EmailVerificationPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>("");

  // Get email from query params or localStorage
  useEffect(() => {
    const emailParam = searchParams?.get("email");
    const storedEmail = localStorage.getItem("verification.email");

    setEmail(emailParam || storedEmail || "");
  }, [searchParams]);

  const handleVerificationComplete = () => {
    // Clear stored email and redirect to login
    localStorage.removeItem("verification.email");
    router.push("/auth/login?verified=true");
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Check your inbox and click the verification link"
      showLogo={true}
    >
      <div className="space-y-6">
        <EmailVerification
          email={email}
          onVerified={handleVerificationComplete}
        />

        {/* Additional links */}
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            <p>
              Already verified?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Wrong email address?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create a new account
              </Link>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
