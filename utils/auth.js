// lib/auth-utils.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Mengambil data user dari cookie `auth_token` (JWT)
 * @returns {Object|null} user payload dari token atau null jika tidak valid
 */
export async function getUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
