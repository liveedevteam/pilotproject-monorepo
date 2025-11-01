import { Metadata } from "next";
import { PasswordResetPageClient } from "./reset-page-client";

export const metadata: Metadata = {
  title: "Reset Password | Your App",
  description: "Reset your password to regain access to your account.",
  keywords: ["password reset", "forgot password", "account recovery"],
  robots: "noindex", // Prevent indexing of auth pages
};

export default function PasswordResetPage() {
  return <PasswordResetPageClient />;
}
