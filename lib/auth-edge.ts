/**
 * Edge-safe auth utilities.
 * This module MUST NOT import 'cookies' from 'next/headers'.
 * It is used by middleware which runs in the Edge runtime.
 */
import { SignJWT, jwtVerify } from "jose";
import { validateServerEnv } from "./env";

validateServerEnv();

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
    throw new Error("Missing required environment variable: JWT_SECRET");
}

const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload as Record<string, unknown>;
}
