import { cookies } from "next/headers";
import { encrypt, decrypt } from "./auth-edge";

// Re-export encrypt and decrypt for server-side usage
export { encrypt, decrypt };

// ─── ADMIN SESSION ──────────────────────────────

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

// ─── USER SESSION ───────────────────────────────

export async function getUserSession(): Promise<{ userId: string; email: string; name: string } | null> {
  const session = (await cookies()).get("user-session")?.value;
  if (!session) return null;
  try {
    const payload = await decrypt(session);
    if (payload.role !== 'user' || !payload.userId) return null;
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function setUserSession(user: { id: string; email: string; name: string }) {
  const token = await encrypt({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: 'user',
  });
  (await cookies()).set("user-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
}

export async function clearUserSession() {
  (await cookies()).delete("user-session");
}
