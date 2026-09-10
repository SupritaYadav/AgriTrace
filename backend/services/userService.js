import { db } from "../core/firebase.js";

export async function createUserProfile(uid, email, role) {
  const userRef = db.collection("users").doc(uid);

  // Check whether profile already exists
  const existingUser = await userRef.get();

  if (existingUser.exists) {
    const error = new Error("User profile already exists");
    error.code = "USER_ALREADY_REGISTERED";
    throw error;
  }

  const data = {
    uid,
    email,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await userRef.create(data);
  } catch (error) {
    if (error.code === 6 || error.code === "already-exists") {
      const duplicateError = new Error("User profile already exists");
      duplicateError.code = "USER_ALREADY_REGISTERED";
      throw duplicateError;
    }

    throw error;
  }

  return data;
}


export async function getUserProfile(uid) {
  const doc = await db
    .collection("users")
    .doc(uid)
    .get();

  return doc.exists ? doc.data() : null;
}