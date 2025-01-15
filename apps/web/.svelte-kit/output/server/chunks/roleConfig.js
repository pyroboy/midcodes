function isValidUserRole(role) {
  return Object.keys(RoleConfig).includes(role);
}
const PublicPaths = {
  auth: "/auth",
  error: "/error",
  home: "/",
  register: "/register",
  constrack: "/constrack",
  dokmutya: "/dokmutya"
};
function isPublicPathValue(path) {
  return Object.values(PublicPaths).includes(path);
}
function isPublicPath(path) {
  if (path === "/") return true;
  const cleanPath = path.replace(/\/$/, "");
  if (isPublicPathValue(cleanPath)) {
    return true;
  }
  if (cleanPath.startsWith("/events/") && cleanPath.endsWith("/register")) {
    return true;
  }
  return false;
}
function shouldSkipLayout(path) {
  return isPublicPath(path);
}
function hasPathAccess(role, path, originalRole) {
  if (isPublicPath(path)) return true;
  const roleConfig = RoleConfig[role];
  if (!roleConfig) return false;
  if (roleConfig.allowedPaths.some((ap) => ap.path === "*" || ap.path === "/**")) {
    return true;
  }
  const cleanPath = path.replace(/\/$/, "");
  return roleConfig.allowedPaths.some((allowedPath) => {
    const pattern = allowedPath.path.replace(/\/$/, "").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]+");
    return new RegExp("^" + pattern + "$").test(cleanPath);
  });
}
function getRedirectPath(role, path, originalRole, context) {
  if (isPublicPath(path)) return null;
  const roleConfig = RoleConfig[role];
  if (!roleConfig) return PublicPaths.auth;
  if (hasPathAccess(role, path)) return null;
  const isKnownPath = Object.values(RoleConfig).some(
    (config) => config.allowedPaths.some((allowedPath) => {
      const pattern = allowedPath.path.replace(/\/$/, "").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]+");
      return new RegExp("^" + pattern + "$").test(path);
    })
  );
  if (!isKnownPath) return PublicPaths.error;
  const defaultRedirect = roleConfig.defaultPath(context);
  if (!hasPathAccess(role, defaultRedirect)) {
    return PublicPaths.auth;
  }
  return path === defaultRedirect ? PublicPaths.auth : defaultRedirect;
}
const RoleConfig = {
  super_admin: {
    allowedPaths: [{ path: "/**" }],
    defaultPath() {
      return "/";
    },
    isAdmin: true,
    label: "Super Admin",
    requiresOrgId: true
  },
  org_admin: {
    allowedPaths: [{ path: "/**" }],
    defaultPath() {
      return "/";
    },
    isAdmin: true,
    label: "Organization Admin",
    requiresOrgId: true
  },
  user: {
    allowedPaths: [
      { path: "/auth" },
      { path: "/profile" }
    ],
    defaultPath() {
      return "/profile";
    },
    isAdmin: false,
    label: "Regular User",
    requiresOrgId: false
  },
  event_admin: {
    allowedPaths: [
      { path: "/events/**" },
      { path: "/events/*/payments" },
      { path: "/events/*/qr-checker" },
      { path: "/events/*/name-tags" },
      { path: "/events/*/test" },
      { path: "/api/**" }
    ],
    defaultPath: (context) => `/events/${context?.event_url}`,
    isAdmin: true,
    label: "Event Admin",
    requiresOrgId: true
  },
  event_qr_checker: {
    allowedPaths: [
      { path: "/events/*/qr-checker" }
    ],
    defaultPath: (context) => `/events/${context?.event_url}/qr-checker`,
    isAdmin: false,
    label: "Event QR Checker",
    requiresOrgId: true
  },
  property_admin: {
    allowedPaths: [
      { path: "/dorm", showInNav: true, label: "Dormitory" },
      { path: "/dorm/overview/monthly", showInNav: true, label: "Overview" },
      { path: "/dorm/properties", showInNav: true, label: "Properties" },
      { path: "/dorm/floors", showInNav: true, label: "Floors" },
      { path: "/dorm/rental_unit", showInNav: true, label: "Rental_Units" },
      { path: "/dorm/tenants", showInNav: true, label: "Tenants" },
      { path: "/dorm/leases", showInNav: true, label: "Leases" },
      { path: "/dorm/payments", showInNav: true, label: "Payments" },
      { path: "/dorm/transactions", showInNav: true, label: "Transactions" },
      { path: "/dorm/meters", showInNav: true, label: "Meters" },
      { path: "/dorm/readings", showInNav: true, label: "Readings" },
      { path: "/dorm/utility-billings", showInNav: true, label: "Utility Billings" },
      { path: "/dorm/expenses", showInNav: true, label: "Expenses" },
      { path: "/dorm/budgets", showInNav: true, label: "Budgets" },
      { path: "/dorm/accounts", showInNav: true, label: "Accounts" },
      { path: "/dorm/**" }
    ],
    defaultPath() {
      return "/dorm";
    },
    isAdmin: true,
    label: "Property Admin",
    requiresOrgId: true
  },
  property_manager: {
    allowedPaths: [
      { path: "/property/*/manage", showInNav: true, label: "Property Management" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Manager",
    requiresOrgId: true
  },
  property_accountant: {
    allowedPaths: [
      { path: "/property/*/accounting", showInNav: true, label: "Property Accounting" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Accountant",
    requiresOrgId: true
  },
  property_maintenance: {
    allowedPaths: [
      { path: "/property/*/maintenance", showInNav: true, label: "Maintenance" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Maintenance",
    requiresOrgId: true
  },
  property_utility: {
    allowedPaths: [
      { path: "/property/*/utility", showInNav: true, label: "Utilities" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Utility",
    requiresOrgId: true
  },
  property_frontdesk: {
    allowedPaths: [
      { path: "/property/*/frontdesk", showInNav: true, label: "Front Desk" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Front Desk",
    requiresOrgId: true
  },
  property_tenant: {
    allowedPaths: [
      { path: "/property/*/tenant", showInNav: true, label: "Tenant Portal" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Tenant",
    requiresOrgId: true
  },
  property_guest: {
    allowedPaths: [
      { path: "/property/*/guest", showInNav: true, label: "Guest Portal" }
    ],
    defaultPath() {
      return "/property";
    },
    isAdmin: false,
    label: "Property Guest",
    requiresOrgId: true
  },
  id_gen_admin: {
    allowedPaths: [
      { path: "/id-gen/templates", showInNav: true, label: "Templates" },
      { path: "/id-gen/all-ids", showInNav: true, label: "Generated IDs" },
      { path: "/id-gen" },
      { path: "/id-gen/**" },
      { path: "/id-gen/use-template/**" }
    ],
    defaultPath() {
      return "/id-gen";
    },
    isAdmin: true,
    label: "ID Generator Admin",
    requiresOrgId: true
  },
  id_gen_user: {
    allowedPaths: [
      { path: "/id-gen/use-template", showInNav: true, label: "Generate IDs" },
      { path: "/id-gen/use-template/**" }
    ],
    defaultPath() {
      return "/id-gen/use-template";
    },
    isAdmin: false,
    label: "ID Generator User",
    requiresOrgId: true
  }
};
export {
  PublicPaths as P,
  RoleConfig as R,
  getRedirectPath as g,
  isValidUserRole as i,
  shouldSkipLayout as s
};
