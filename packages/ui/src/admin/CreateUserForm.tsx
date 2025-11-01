"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/button";
import { FormInput, PasswordInput } from "../auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card";
import { Alert, AlertDescription } from "../components/alert";
import { Checkbox } from "../components/checkbox";
import { Label } from "../components/label";
import { Badge } from "../components/badge";
import { X, Plus, AlertCircle, CheckCircle } from "lucide-react";

// Create user schema
const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  sendWelcomeEmail: z.boolean().default(true),
  requirePasswordChange: z.boolean().default(true),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
}

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData & { roles: string[] }) => Promise<void>;
  onCancel?: () => void;
  availableRoles?: Role[];
  isLoading?: boolean;
  className?: string;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onSubmit,
  onCancel,
  availableRoles = [],
  isLoading = false,
  className = "",
}) => {
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      sendWelcomeEmail: true,
      requirePasswordChange: true,
    },
  });

  const password = watch("password");

  // Handle role selection
  const handleRoleToggle = (roleId: string) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(roleId)) {
      newRoles.delete(roleId);
    } else {
      newRoles.add(roleId);
    }
    setSelectedRoles(newRoles);
  };

  // Handle form submission
  const handleFormSubmit = async (data: CreateUserFormData) => {
    setError(null);
    setSuccess(null);

    try {
      await onSubmit({
        ...data,
        roles: Array.from(selectedRoles),
      });

      setSuccess("User created successfully!");
      reset();
      setSelectedRoles(new Set());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create user"
      );
    }
  };

  // Get password strength
  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    if (strength <= 2) {
      return { strength, label: "Weak", color: "bg-red-500" };
    } else if (strength <= 3) {
      return { strength, label: "Fair", color: "bg-yellow-500" };
    } else if (strength <= 4) {
      return { strength, label: "Good", color: "bg-blue-500" };
    } else {
      return { strength, label: "Strong", color: "bg-green-500" };
    }
  };

  const passwordStrength = getPasswordStrength(password || "");

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>
          Add a new user to the system and assign roles and permissions.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="First Name"
                placeholder="Enter first name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <FormInput
                label="Last Name"
                placeholder="Enter last name"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            <FormInput
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <FormInput
              label="Phone Number"
              type="tel"
              placeholder="Optional phone number"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Security</h3>

            <div>
              <PasswordInput
                label="Password"
                placeholder="Create a secure password"
                error={errors.password?.message}
                {...register("password")}
              />

              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength</span>
                    <span
                      className={`font-medium ${
                        passwordStrength.strength <= 2
                          ? "text-red-600"
                          : passwordStrength.strength <= 3
                            ? "text-yellow-600"
                            : passwordStrength.strength <= 4
                              ? "text-blue-600"
                              : "text-green-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= passwordStrength.strength
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendWelcomeEmail"
                  {...register("sendWelcomeEmail")}
                />
                <Label htmlFor="sendWelcomeEmail">
                  Send welcome email with login instructions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requirePasswordChange"
                  {...register("requirePasswordChange")}
                />
                <Label htmlFor="requirePasswordChange">
                  Require password change on first login
                </Label>
              </div>
            </div>
          </div>

          {/* Role Assignment */}
          {availableRoles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Role Assignment</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableRoles.map(role => (
                  <div
                    key={role.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoles.has(role.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <Checkbox
                        checked={selectedRoles.has(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {selectedRoles.size > 0 && (
                <div>
                  <Label className="text-sm font-medium">Selected Roles:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(selectedRoles).map(roleId => {
                      const role = availableRoles.find(r => r.id === roleId);
                      return role ? (
                        <Badge
                          key={roleId}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {role.name}
                          <button
                            type="button"
                            onClick={() => handleRoleToggle(roleId)}
                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
