import { Metadata } from "next";
import { ProfilePageClient } from "./profile-page-client";

export const metadata: Metadata = {
  title: "Profile | Your App",
  description: "Manage your account profile and settings.",
  keywords: ["profile", "account settings", "user profile"],
  robots: "noindex", // Prevent indexing of auth pages
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
