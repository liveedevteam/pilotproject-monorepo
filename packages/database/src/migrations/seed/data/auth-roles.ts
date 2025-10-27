// Default roles data
export const authRolesData = [
  {
    name: "super_admin",
    description: "Full system access",
    isSystem: true,
  },
  {
    name: "admin",
    description: "Administrative access",
    isSystem: true,
  },
  {
    name: "manager",
    description: "Management level access",
    isSystem: true,
  },
  {
    name: "user",
    description: "Standard user access",
    isSystem: true,
  },
  {
    name: "guest",
    description: "Limited read-only access",
    isSystem: true,
  },
];

// Role-permission mappings
export const rolePermissionMappings = {
  super_admin: [
    // Super admin gets all permissions
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "users:list",
    "roles:create",
    "roles:read",
    "roles:update",
    "roles:delete",
    "roles:assign",
    "posts:create",
    "posts:read",
    "posts:update",
    "posts:delete",
    "posts:publish",
    "settings:read",
    "settings:update",
    "reports:read",
    "analytics:read",
  ],
  admin: [
    // Admin gets user and content management
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "users:list",
    "roles:read",
    "roles:assign",
    "posts:create",
    "posts:read",
    "posts:update",
    "posts:delete",
    "posts:publish",
    "reports:read",
    "analytics:read",
  ],
  manager: [
    // Manager gets team and content management
    "users:read",
    "users:update",
    "users:list",
    "posts:create",
    "posts:read",
    "posts:update",
    "posts:publish",
    "reports:read",
  ],
  user: [
    // User gets basic content permissions
    "posts:create",
    "posts:read",
    "posts:update",
  ],
  guest: [
    // Guest gets read-only access
    "posts:read",
  ],
};
