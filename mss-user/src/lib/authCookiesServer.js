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

export function getAuthTokenServer() {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  return decodeCookieValue(token);
}

export function getAuthUserServer() {
  const raw = cookies().get(USER_COOKIE)?.value;
  const decoded = decodeCookieValue(raw);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

