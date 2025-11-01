import { Metadata } from "next";
import { Suspense } from "react";
import { PasswordResetPageClient } from "./reset-page-client";

export const metadata: Metadata = {
  title: "Reset Password | Your App",
  description: "Reset your password to regain access to your account.",
  keywords: ["password reset", "forgot password", "account recovery"],
  robots: "noindex", // Prevent indexing of auth pages
};

function ResetPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<ResetPageFallback />}>
      <PasswordResetPageClient />
    </Suspense>
  );
}
