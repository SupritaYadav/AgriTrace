export const Role = Object.freeze({
  FARMER: "FARMER",
  TRANSPORTER: "TRANSPORTER",
  WAREHOUSE: "WAREHOUSE",
  RETAILER: "RETAILER",
  ADMIN: "ADMIN",
});

// Roles a normal user is allowed to choose during signup
export const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  Role.FARMER,
  Role.TRANSPORTER,
  Role.WAREHOUSE,
  Role.RETAILER,
]);

export function isPublicRegistrationRole(role) {
  return PUBLIC_REGISTRATION_ROLES.includes(role);
}

// Roles that are operational (non-admin) and participate in the supply chain
export const OPERATIONAL_ROLES = Object.freeze([
  Role.FARMER,
  Role.TRANSPORTER,
  Role.WAREHOUSE,
  Role.RETAILER,
]);
