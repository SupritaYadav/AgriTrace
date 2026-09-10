   import { initializeApp, cert } from "firebase-admin/app";
   import { getAuth } from "firebase-admin/auth";
   import { getFirestore } from "firebase-admin/firestore";
   import { readFileSync } from "fs";
   import dotenv from "dotenv";

   dotenv.config();

   const serviceAccount = JSON.parse(
     readFileSync(process.env.FIREBASE_CREDENTIALS_PATH, "utf8")
   );

   initializeApp({
     credential: cert(serviceAccount),
   });

   export const auth = getAuth();
   export const db = getFirestore();

   export async function verifyToken(idToken) {
     return await auth.verifyIdToken(idToken);
   }