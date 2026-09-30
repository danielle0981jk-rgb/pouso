import { timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { parse } from "cookie";
import type { User } from "../drizzle/schema";

export const LOCAL_ADMIN_COOKIE = "pouso_admin_session";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET não foi configurado.");
  return new TextEncoder().encode(value);
}

function configuredEmail() { return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(); }
function configuredPassword() { return process.env.ADMIN_PASSWORD ?? ""; }

export const localSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
});

const buildUser = (email: string): User => {
  const now = new Date();
  return { id: 0, openId: `local:${email}`.slice(0, 64), name: "Administrador", email, loginMethod: "local", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now };
};

export async function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = Buffer.from(configuredEmail());
  const receivedEmail = Buffer.from(email.trim().toLowerCase());
  const expectedPassword = Buffer.from(configuredPassword());
  const receivedPassword = Buffer.from(password);
  if (!expectedEmail.length || !expectedPassword.length) return false;
  const emailOk = expectedEmail.length === receivedEmail.length && timingSafeEqual(expectedEmail, receivedEmail);
  const passwordOk = expectedPassword.length === receivedPassword.length && timingSafeEqual(expectedPassword, receivedPassword);
  return emailOk && passwordOk;
}

export async function createAdminSession(email: string) {
  return new SignJWT({ email: email.trim().toLowerCase(), scope: "admin" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
}

export async function getLocalAdminUser(req: Request): Promise<User | null> {
  try {
    const token = parse(req.headers.cookie ?? "")[LOCAL_ADMIN_COOKIE];
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const email = typeof payload.email === "string" ? payload.email : "";
    return payload.scope === "admin" && email === configuredEmail() ? buildUser(email) : null;
  } catch { return null; }
}
