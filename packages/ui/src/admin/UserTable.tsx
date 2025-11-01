"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Download,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Badge } from "../components/badge";
import { Checkbox } from "../components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
}

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onUserEdit?: (user: User) => void;
  onUserDelete?: (user: User) => void;
  onUserRoleEdit?: (user: User) => void;
  onBulkAction?: (action: string, userIds: string[]) => void;
  onCreateUser?: () => void;
  className?: string;
}

type SortField = keyof User | "fullName";
type SortDirection = "asc" | "desc";

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  onUserEdit,
  onUserDelete,
  onUserRoleEdit,
  onBulkAction,
  onCreateUser,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "unverified"
  >("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.roles.some(role => role.toLowerCase().includes(searchLower));

      // Status filter
      let matchesStatus = true;
      switch (statusFilter) {
        case "active":
          matchesStatus = user.isActive && user.emailVerified;
          break;
        case "inactive":
          matchesStatus = !user.isActive;
          break;
        case "unverified":
          matchesStatus = user.isActive && !user.emailVerified;
          break;
        default:
          matchesStatus = true;
      }

      return matchesSearch && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      if (sortField === "fullName") {
        aValue = `${a.firstName || ""} ${a.lastName || ""}`.trim();
        bValue = `${b.firstName || ""} ${b.lastName || ""}`.trim();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      // Handle dates
      if (aValue instanceof Date || bValue instanceof Date) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // String comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchTerm, statusFilter, sortField, sortDirection]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Handle user selection
  const handleUserSelect = (userId: string, selected: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (selected) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Format user status
  const getUserStatus = (user: User) => {
    if (!user.isActive)
      return { label: "Inactive", variant: "destructive" as const };
    if (!user.emailVerified)
      return { label: "Unverified", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  // Format last login
  const formatLastLogin = (date: Date | null) => {
    if (!date) return "Never";
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      "day"
    );
  };

  const allSelected =
    filteredAndSortedUsers.length > 0 &&
    filteredAndSortedUsers.every(user => selectedUsers.has(user.id));
  const someSelected = selectedUsers.size > 0 && !allSelected;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-600">
            Manage user accounts and permissions (
            {filteredAndSortedUsers.length} users)
          </p>
        </div>

        {onCreateUser && (
          <Button onClick={onCreateUser} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create User
          </Button>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && onBulkAction && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedUsers.size} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    onBulkAction("activate", Array.from(selectedUsers))
                  }
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onBulkAction("deactivate", Array.from(selectedUsers))
                  }
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    onBulkAction("delete", Array.from(selectedUsers))
                  }
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Export */}
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all users"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("fullName")}
              >
                <div className="flex items-center gap-1">
                  Name
                  {getSortIcon("fullName")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-1">
                  Email
                  {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("lastLoginAt")}
              >
                <div className="flex items-center gap-1">
                  Last Login
                  {getSortIcon("lastLoginAt")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-1">
                  Created
                  {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredAndSortedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  {searchTerm || statusFilter !== "all"
                    ? "No users found matching your criteria"
                    : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={checked =>
                        handleUserSelect(user.id, checked as boolean)
                      }
                      aria-label={`Select ${user.email}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.lastName || "—"}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{user.email}</div>
                      {!user.emailVerified && (
                        <div className="text-xs text-orange-600">
                          Unverified
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-gray-400 text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUserStatus(user).variant}>
                      {getUserStatus(user).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatLastLogin(user.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onUserEdit && (
                          <DropdownMenuItem onClick={() => onUserEdit(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                        )}
                        {onUserRoleEdit && (
                          <DropdownMenuItem
                            onClick={() => onUserRoleEdit(user)}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Manage Roles
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onUserDelete && (
                          <DropdownMenuItem
                            onClick={() => onUserDelete(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination would go here */}
      {!isLoading && filteredAndSortedUsers.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedUsers.length} of {users.length} users
          </div>
          {/* Pagination component would be implemented here */}
        </div>
      )}
    </div>
  );
};
