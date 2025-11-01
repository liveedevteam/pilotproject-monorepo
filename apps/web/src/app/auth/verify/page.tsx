import { Metadata } from "next";
import { Suspense } from "react";
import { EmailVerificationPageClient } from "./verify-page-client";

export const metadata: Metadata = {
  title: "Verify Email | Your App",
  description: "Verify your email address to activate your account.",
  keywords: ["email verification", "account activation", "verify email"],
  robots: "noindex", // Prevent indexing of auth pages
};

function VerificationPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<VerificationPageFallback />}>
      <EmailVerificationPageClient />
    </Suspense>
  );
}
