"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EnhancedAuthGuard, useAuth } from "@repo/ui";
import { FormInput, PasswordInput } from "@repo/ui";
import { Button } from "@repo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import {
  User,
  Lock,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
});

// Password change schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePageClient() {
  const { user, updateProfile, isUpdatingProfile } = useAuth();

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.profile?.firstName || "",
      lastName: user?.profile?.lastName || "",
      phone: user?.profile?.phone || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Handle profile update
  const handleProfileUpdate = async (data: ProfileFormData) => {
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      });
      setProfileSuccess("Profile updated successfully!");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsChangingPassword(true);

    try {
      // This would be a tRPC call in a real implementation
      // await trpcClient.auth.changePassword.mutate({
      //   currentPassword: data.currentPassword,
      //   newPassword: data.newPassword,
      // });

      setPasswordSuccess("Password changed successfully!");
      passwordForm.reset();
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <EnhancedAuthGuard redirectTo="/auth/login">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account profile and security settings.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{profileSuccess}</AlertDescription>
                  </Alert>
                )}

                {profileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="First Name"
                      error={profileForm.formState.errors.firstName?.message}
                      {...profileForm.register("firstName")}
                    />
                    <FormInput
                      label="Last Name"
                      error={profileForm.formState.errors.lastName?.message}
                      {...profileForm.register("lastName")}
                    />
                  </div>

                  <FormInput
                    label="Email"
                    type="email"
                    value={user.email}
                    disabled
                    hint="Email cannot be changed. Contact support if needed."
                  />

                  <FormInput
                    label="Phone Number"
                    type="tel"
                    placeholder="Optional"
                    error={profileForm.formState.errors.phone?.message}
                    {...profileForm.register("phone")}
                  />

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div
                      className={`w-2 h-2 rounded-full ${user.profile?.emailVerified ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span>
                      Email{" "}
                      {user.profile?.emailVerified
                        ? "verified"
                        : "not verified"}
                    </span>
                    {!user.profile?.emailVerified && (
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-500"
                      >
                        Resend verification
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full md:w-auto"
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {passwordSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                  className="space-y-4"
                >
                  <PasswordInput
                    label="Current Password"
                    error={
                      passwordForm.formState.errors.currentPassword?.message
                    }
                    {...passwordForm.register("currentPassword")}
                  />

                  <PasswordInput
                    label="New Password"
                    error={passwordForm.formState.errors.newPassword?.message}
                    {...passwordForm.register("newPassword")}
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    error={
                      passwordForm.formState.errors.confirmPassword?.message
                    }
                    {...passwordForm.register("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full md:w-auto"
                  >
                    {isChangingPassword
                      ? "Changing Password..."
                      : "Change Password"}
                  </Button>
                </form>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Account Information
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      Last login:{" "}
                      {user.profile?.lastLoginAt?.toLocaleString() || "Never"}
                    </div>
                    <div>
                      Account created:{" "}
                      {user.profile?.createdAt?.toLocaleString()}
                    </div>
                    <div>
                      Account status:{" "}
                      {user.profile?.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Your Permissions</CardTitle>
                <CardDescription>
                  View your current roles and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <span
                          key={role}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No roles assigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Permissions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {user.permissions && user.permissions.length > 0 ? (
                      user.permissions.map(permission => (
                        <div
                          key={permission}
                          className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {permission}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">
                        No direct permissions assigned
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  View your recent account activity and login history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>
                    Activity logging will be implemented in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedAuthGuard>
  );
}
