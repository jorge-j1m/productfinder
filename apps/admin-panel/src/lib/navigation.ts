import {
  BarChart3,
  Building2Icon,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { type EmployeeRole } from "@repo/database";

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  STAFF: 1,
};

// Navigation types
export interface NavigationItemType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>; // Lucide icon component
  roles: EmployeeRole[];
  href: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

// Check if user has permission for a specific role requirement
export function hasPermission(
  userRole: EmployeeRole,
  requiredRoles: EmployeeRole[],
): boolean {
  return requiredRoles.includes(userRole);
}

// Check if user has minimum role level
export function hasMinimumRole(
  userRole: EmployeeRole,
  minimumRole: EmployeeRole,
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minimumLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= minimumLevel;
}

// Main navigation structure
export const NAVIGATION_ITEMS: NavigationItemType[] = [
  // Dashboard - Available to all roles
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "STAFF"],
    href: "/dashboard",
    description: "Overview and key metrics",
  },

  // Product Management - Admin only
  {
    id: "products",
    label: "Products",
    icon: Package,
    roles: ["ADMIN"],
    href: "/products",
    description: "Manage product catalog",
  },

  // Inventory Management - All roles (different permissions)
  {
    id: "inventory",
    label: "Inventory",
    icon: Warehouse,
    roles: ["ADMIN", "MANAGER", "STAFF"],
    href: "/inventory",
    description: "Stock levels and inventory tracking",
  },

  // Orders - Admin and Manager
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER"],
    href: "/orders",
    description: "Order processing and management",
  },

  // Employee Management - Admin and Manager
  {
    id: "employees",
    label: "Employees",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
    href: "/employees",
    description: "Staff management and roles",
  },

  // Pricing - All roles (view/edit permissions differ)
  {
    id: "pricing",
    label: "Pricing",
    icon: Tag,
    roles: ["ADMIN", "MANAGER", "STAFF"],
    href: "/pricing",
    description: "Product pricing and discounts",
  },

  // Analytics - All roles (different data access)
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER", "STAFF"],
    href: "/analytics",
    description: "Reports and business insights",
  },

  // Sales Reports - Admin and Manager
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    roles: ["ADMIN", "MANAGER"],
    href: "/sales",
    description: "Sales performance and trends",
  },

  // Store Management - Admin only
  {
    id: "stores",
    label: "Stores",
    icon: Store,
    roles: ["ADMIN"],
    href: "/stores",
    description: "Multi-store management",
  },

  {
    id: "store_brands",
    label: "Store Brands",
    icon: Building2Icon,
    roles: ["ADMIN"],
    href: "/store_brands",
    description: "Store brands management",
  },

  // Financial - Admin and Manager
  {
    id: "financial",
    label: "Financial",
    icon: CreditCard,
    roles: ["ADMIN", "MANAGER"],
    href: "/financial",
    description: "Financial reports and payments",
  },

  // Audit Logs - Admin only
  {
    id: "audit",
    label: "Audit Logs",
    icon: FileText,
    roles: ["ADMIN"],
    href: "/audit",
    description: "System activity and audit trail",
  },

  // System Settings - Admin only
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN"],
    href: "/settings",
    description: "System configuration",
  },
];

// Group navigation items by category
export const NAVIGATION_GROUPS = [
  {
    id: "main",
    label: "Main",
    items: ["dashboard"],
  },
  {
    id: "management",
    label: "Management",
    items: ["employees", "stores", "store_brands"],
  },
  {
    id: "inventory",
    label: "Inventory",
    items: ["products", "inventory", "pricing"],
  },
  {
    id: "operations",
    label: "Operations",
    items: ["orders", "sales"],
  },
  {
    id: "insights",
    label: "Insights",
    items: ["analytics", "financial"],
  },
  {
    id: "system",
    label: "System",
    items: ["audit", "settings"],
  },
];

// Get filtered navigation items for a user role
export function getNavigationForRole(
  userRole: EmployeeRole,
): NavigationItemType[] {
  return NAVIGATION_ITEMS.filter((item) => hasPermission(userRole, item.roles));
}

// Get navigation items grouped by category for a user role
export function getGroupedNavigationForRole(userRole: EmployeeRole) {
  const userItems = getNavigationForRole(userRole);
  const itemsById = new Map(userItems.map((item) => [item.id, item]));

  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .map((itemId) => itemsById.get(itemId))
      .filter(Boolean) as NavigationItemType[],
  })).filter((group) => group.items.length > 0);
}
