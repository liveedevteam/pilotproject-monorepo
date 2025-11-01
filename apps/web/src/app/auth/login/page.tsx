import { Metadata } from "next";
import { Suspense } from "react";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Sign In | Your App",
  description:
    "Sign in to your account to access your dashboard and manage your data.",
  keywords: ["login", "sign in", "authentication"],
  robots: "noindex", // Prevent indexing of auth pages
};

function LoginPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}
