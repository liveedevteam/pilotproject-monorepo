import { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePageClient } from "./profile-page-client";

export const metadata: Metadata = {
  title: "Profile | Your App",
  description: "Manage your account profile and settings.",
  keywords: ["profile", "account settings", "user profile"],
  robots: "noindex", // Prevent indexing of auth pages
};

function ProfilePageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageClient />
    </Suspense>
  );
}
