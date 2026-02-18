import { parse, serialize } from "cookie";
import type { CookieSerializeOptions } from "cookie";

export type CookieToGet = { name: string; value: string };
export type CookieToSet = { name: string; value: string; options?: CookieSerializeOptions };

/**
 * Creates a cookie store that reads from the Request and accumulates
 * Set-Cookie headers for the response (for Supabase SSR).
 */
export function createRequestCookieStore(cookieHeader: string | null) {
  const toSet: CookieToSet[] = [];

  const getAll = async (): Promise<CookieToGet[] | null> => {
    const raw = cookieHeader || "";
    const parsed = parse(raw);
    return Object.entries(parsed).map(([name, value]) => ({
      name,
      value: String(value ?? ""),
    }));
  };

  const setAll = async (cookies: CookieToSet[]): Promise<void> => {
    toSet.push(...cookies);
  };

  const getSetCookieHeaders = (): string[] => {
    return toSet.map(({ name, value, options }) => {
      return serialize(name, value, {
        path: "/",
        sameSite: "lax",
        ...options,
      });
    });
  };

  return { getAll, setAll, getSetCookieHeaders };
}

export function appendSetCookieHeaders(headers: Headers, setCookieStrings: string[]): void {
  setCookieStrings.forEach((s) => headers.append("Set-Cookie", s));
}
