const ADMIN_ROLES = [
  "super_admin",
  "org_admin",
  "property_admin",
  "property_manager",
  "property_accountant",
  "id_gen_admin"
];
const STAFF_ROLES = [
  "property_maintenance",
  "property_utility",
  "property_frontdesk",
  "event_admin",
  "event_qr_checker"
];
const VIEW_ROLES = [
  "property_tenant",
  "property_guest",
  "id_gen_user",
  "user"
];
function checkAccess(userRole, requiredLevel) {
  if (!userRole) return false;
  switch (requiredLevel) {
    case "admin":
      return ADMIN_ROLES.includes(userRole);
    case "staff":
      return ADMIN_ROLES.includes(userRole) || STAFF_ROLES.includes(userRole);
    case "view":
      return ADMIN_ROLES.includes(userRole) || STAFF_ROLES.includes(userRole) || VIEW_ROLES.includes(userRole);
    default:
      return false;
  }
}
export {
  checkAccess as c
};
