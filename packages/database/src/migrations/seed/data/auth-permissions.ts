// Authentication permissions data
export const authPermissionsData = [
  // User management
  {
    name: "users:create",
    description: "Create new users",
    resource: "users",
    action: "create",
  },
  {
    name: "users:read",
    description: "View user information",
    resource: "users",
    action: "read",
  },
  {
    name: "users:update",
    description: "Update user information",
    resource: "users",
    action: "update",
  },
  {
    name: "users:delete",
    description: "Delete users",
    resource: "users",
    action: "delete",
  },
  {
    name: "users:list",
    description: "List all users",
    resource: "users",
    action: "list",
  },

  // Role management
  {
    name: "roles:create",
    description: "Create new roles",
    resource: "roles",
    action: "create",
  },
  {
    name: "roles:read",
    description: "View role information",
    resource: "roles",
    action: "read",
  },
  {
    name: "roles:update",
    description: "Update role information",
    resource: "roles",
    action: "update",
  },
  {
    name: "roles:delete",
    description: "Delete roles",
    resource: "roles",
    action: "delete",
  },
  {
    name: "roles:assign",
    description: "Assign roles to users",
    resource: "roles",
    action: "assign",
  },

  // Content management
  {
    name: "content:create",
    description: "Create new content",
    resource: "content",
    action: "create",
  },
  {
    name: "content:read",
    description: "View content",
    resource: "content",
    action: "read",
  },
  {
    name: "content:update",
    description: "Update content",
    resource: "content",
    action: "update",
  },
  {
    name: "content:delete",
    description: "Delete content",
    resource: "content",
    action: "delete",
  },
  {
    name: "content:publish",
    description: "Publish content",
    resource: "content",
    action: "publish",
  },

  // System administration
  {
    name: "system:read",
    description: "View system information",
    resource: "system",
    action: "read",
  },
  {
    name: "system:update",
    description: "Update system settings",
    resource: "system",
    action: "update",
  },
  {
    name: "system:backup",
    description: "Perform system backups",
    resource: "system",
    action: "backup",
  },
];
