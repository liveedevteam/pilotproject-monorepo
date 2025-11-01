import { Metadata } from "next";
import { Suspense } from "react";
import { PasswordResetConfirmPageClient } from "./confirm-page-client";

export const metadata: Metadata = {
  title: "Confirm Password Reset | Your App",
  description: "Enter your new password to complete the reset process.",
  keywords: ["password reset", "new password", "account recovery"],
  robots: "noindex", // Prevent indexing of auth pages
};

function ResetConfirmPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function PasswordResetConfirmPage() {
  return (
    <Suspense fallback={<ResetConfirmPageFallback />}>
      <PasswordResetConfirmPageClient />
    </Suspense>
  );
}
