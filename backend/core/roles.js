export const Role = Object.freeze({
  FARMER: "FARMER",
  TRANSPORTER: "TRANSPORTER",
  WAREHOUSE: "WAREHOUSE",
  ADMIN: "ADMIN",
});

// Roles a normal user is allowed to choose during signup
export const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  Role.FARMER,
  Role.TRANSPORTER,
  Role.WAREHOUSE,
]);

export function isPublicRegistrationRole(role) {
  return PUBLIC_REGISTRATION_ROLES.includes(role);
}