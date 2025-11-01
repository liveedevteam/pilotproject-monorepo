import { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Sign In | Your App",
  description:
    "Sign in to your account to access your dashboard and manage your data.",
  keywords: ["login", "sign in", "authentication"],
  robots: "noindex", // Prevent indexing of auth pages
};

export default function LoginPage() {
  return <LoginPageClient />;
}
