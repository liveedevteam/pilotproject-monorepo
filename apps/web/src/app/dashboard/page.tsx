"use client";

import { useAuth, EnhancedAuthGuard } from "@repo/ui";
import { trpc } from "@/trpc/client";

function DashboardContent() {
  const { user, signOut, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: users, isLoading } = trpc.user.getAll.useQuery({});

  // Debug logging
  console.log("DashboardContent - Auth State:", {
    isAuthenticated,
    authLoading,
    user: user ? { id: user.id, email: user.email } : null,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.profile?.firstName || user?.email}!
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Profile
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">ID:</span> {user?.id}
            </p>
            <p>
              <span className="font-medium">First Name:</span>{" "}
              {user?.profile?.firstName || "Not set"}
            </p>
            <p>
              <span className="font-medium">Last Name:</span>{" "}
              {user?.profile?.lastName || "Not set"}
            </p>
            <p>
              <span className="font-medium">Email Verified:</span>{" "}
              {user?.profile?.emailVerified ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Users
          </h2>
          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="space-y-2">
              {users?.data.map(user => (
                <div key={user.id} className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{user.name || "No name"}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging for the guard
  console.log("DashboardPage Guard - Auth State:", {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, email: user.email } : null,
  });

  return (
    <EnhancedAuthGuard
      requireAuth={true}
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              Please sign in to access the dashboard.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Debug: isAuthenticated={String(isAuthenticated)}, isLoading=
              {String(isLoading)}
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </EnhancedAuthGuard>
  );
}
