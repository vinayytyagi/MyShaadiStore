import { cookies } from "next/headers";

const TOKEN_COOKIE = "mss_token";
const USER_COOKIE = "mss_user";

function decodeCookieValue(value) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function getCookieStore() {
  const store = cookies();
  return typeof store?.then === "function" ? await store : store;
}

export async function getAuthTokenServer() {
  const cookieStore = await getCookieStore();
  const token = cookieStore?.get?.(TOKEN_COOKIE)?.value;
  return decodeCookieValue(token);
}

export async function getAuthUserServer() {
  const cookieStore = await getCookieStore();
  const raw = cookieStore?.get?.(USER_COOKIE)?.value;
  const decoded = decodeCookieValue(raw);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

