import { Metadata } from "next";
import { Suspense } from "react";
import { RegisterPageClient } from "./register-page-client";

export const metadata: Metadata = {
  title: "Create Account | Your App",
  description:
    "Create a new account to get started with our platform and access all features.",
  keywords: ["register", "sign up", "create account", "authentication"],
  robots: "noindex", // Prevent indexing of auth pages
};

function RegisterPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageClient />
    </Suspense>
  );
}
