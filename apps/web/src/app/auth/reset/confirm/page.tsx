import { Metadata } from "next";
import { PasswordResetConfirmPageClient } from "./confirm-page-client";

export const metadata: Metadata = {
  title: "Confirm Password Reset | Your App",
  description: "Enter your new password to complete the reset process.",
  keywords: ["password reset", "new password", "account recovery"],
  robots: "noindex", // Prevent indexing of auth pages
};

export default function PasswordResetConfirmPage() {
  return <PasswordResetConfirmPageClient />;
}
