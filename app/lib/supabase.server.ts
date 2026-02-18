import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createRequestCookieStore } from "./cookie.server";

export function createServerClient(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const { getAll, setAll, getSetCookieHeaders } = createRequestCookieStore(cookieHeader);

  const supabase = createSSRClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll,
        setAll,
      },
    }
  );

  return { supabase, getSetCookieHeaders };
}

