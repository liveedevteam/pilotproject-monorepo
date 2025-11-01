import { Metadata } from "next";
import { RegisterPageClient } from "./register-page-client";

export const metadata: Metadata = {
  title: "Create Account | Your App",
  description:
    "Create a new account to get started with our platform and access all features.",
  keywords: ["register", "sign up", "create account", "authentication"],
  robots: "noindex", // Prevent indexing of auth pages
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
