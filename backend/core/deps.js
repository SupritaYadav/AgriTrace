import { verifyToken, auth } from "./firebase.js";
import { getCollection } from "./mongo.js";
import { Role } from "./roles.js";

export async function getCurrentUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Invalid authorization header" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(idToken);

    try {
      const userDoc = await getCollection("users").findOne({ uid: decoded.uid });
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: userDoc?.role || null,
        name: userDoc?.name || decoded.name || null,
        organisation: userDoc?.organisation || null,
        phone: userDoc?.phone || null,
        profile: userDoc || null,
      };
    } catch (dbErr) {
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: null,
        name: decoded.name || null,
        organisation: null,
        phone: null,
        profile: null,
      };
    }

    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({ detail: "User profile not found or role not assigned" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ detail: "Not authorized for this action" });
    }

    next();
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== Role.ADMIN) {
    return res.status(403).json({ detail: "Admin access required" });
  }
  next();
}

export { auth };
