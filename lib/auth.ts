import { cookies } from "next/headers";
import { encrypt, decrypt } from "./auth-edge";

// Re-export encrypt and decrypt for server-side usage
export { encrypt, decrypt };

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

/**
 * Verify that the current request is from an authenticated admin.
 * Throws an error if not authenticated.
 */
export async function verifyAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
}
