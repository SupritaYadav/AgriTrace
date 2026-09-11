import { verifyToken, auth } from "./firebase.js";
import { getCollection } from "./mongo.js";

export async function getCurrentUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Invalid authorization header" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const userDoc = await getCollection("users").findOne({ uid: req.user.uid });
    if (!userDoc || !allowedRoles.includes(userDoc.role)) {
      return res.status(403).json({ detail: "Not authorized for this action" });
    }
    req.user.role = userDoc.role;
    next();
  };
}

export { auth };
