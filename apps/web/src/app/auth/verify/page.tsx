import { Metadata } from "next";
import { EmailVerificationPageClient } from "./verify-page-client";

export const metadata: Metadata = {
  title: "Verify Email | Your App",
  description: "Verify your email address to activate your account.",
  keywords: ["email verification", "account activation", "verify email"],
  robots: "noindex", // Prevent indexing of auth pages
};

export default function EmailVerificationPage() {
  return <EmailVerificationPageClient />;
}
