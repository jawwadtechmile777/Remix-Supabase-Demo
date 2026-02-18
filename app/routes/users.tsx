import {
  data as dataResponse,
  Form,
  redirect,
  useLoaderData,
  useNavigation,
  useNavigate,
} from "react-router";
import { Loader2, LogOut, Pencil, Trash2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createServerClient } from "~/lib/supabase.server";
import { appendSetCookieHeaders } from "~/lib/cookie.server";
import { supabase } from "~/lib/supabase.client";

type ProfileRole = "admin" | "user";
type UsersLoaderData = { users: any[]; role: ProfileRole };

async function getProfileRole(supabaseServer: any, userId: string): Promise<ProfileRole> {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return "user";
  return data?.role === "admin" ? "admin" : "user";
}

// 🔐 AUTH CHECK + LOAD USERS (session from cookies via @supabase/ssr)
export async function loader({ request }: any) {
  const { supabase, getSetCookieHeaders } = createServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const res = redirect("/login");
    appendSetCookieHeaders(res.headers, getSetCookieHeaders());
    return res;
  }

  const role = await getProfileRole(supabase, user.id);
  const isAdmin = role === "admin";

  let query = supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  // Non-admins only see their own rows (admin sees all)
  if (!isAdmin) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const headers = new Headers();
  appendSetCookieHeaders(headers, getSetCookieHeaders());
  return dataResponse(
    { users: data ?? [], role } satisfies UsersLoaderData,
    { headers }
  );
}

// 🔹 ACTION
export async function action({ request }: any) {
  const { supabase, getSetCookieHeaders } = createServerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const res = redirect("/login");
    appendSetCookieHeaders(res.headers, getSetCookieHeaders());
    return res;
  }

  const role = await getProfileRole(supabase, user.id);
  const isAdmin = role === "admin";

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add") {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    await supabase.from("users").insert([
      {
        name,
        email,
        user_id: user.id,
      },
    ]);
  }

  if (intent === "delete") {
    const id = formData.get("id");
    let del = supabase.from("users").delete().eq("id", id);
    if (!isAdmin) del = del.eq("user_id", user.id);
    await del;
  }

  if (intent === "update") {
    const id = formData.get("id");
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    let upd = supabase
      .from("users")
      .update({ name, email, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!isAdmin) upd = upd.eq("user_id", user.id);
    await upd;
  }

  const res = redirect("/users");
  appendSetCookieHeaders(res.headers, getSetCookieHeaders());
  return res;
}

export default function Users() {
  const { users, role } = useLoaderData() as UsersLoaderData;
  const navigation = useNavigation();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (navigation.state === "idle") {
      formRef.current?.reset();
    }
  }, [navigation.state]);

  const submittingIntent = navigation.formData?.get("intent") as
    | "add"
    | "update"
    | "delete"
    | null;
  const submittingId = navigation.formData?.get("id") as string | null;
  const isSubmitting = navigation.state === "submitting";

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      // Use a navigation so loaders run with cleared cookies.
      navigate("/login");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {role === "admin"
                ? "Admin view: you can see and manage all users."
                : "User view: you can only see and manage your own users."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSubmitting && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-3 py-2 text-sm text-indigo-700 dark:text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Working...
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
              title="Log out"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>

        {/* ADD FORM */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add a user row
            </h2>
          </div>

          <Form method="post" ref={formRef} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <input type="hidden" name="intent" value="add" />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Jane Doe"
                required
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="jane@example.com"
                required
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-1 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium py-2.5 px-4 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && submittingIntent === "add" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </button>
          </Form>
        </div>

        {/* LIST */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {role === "admin" ? "All People" : "Your People"}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Array.isArray(users) ? users.length : 0} total
            </span>
          </div>

          {!Array.isArray(users) || users.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-600 dark:text-gray-400">
              No rows yet. Add your first user above.
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {users.map((row: any) => {
                const rowIsUpdating =
                  isSubmitting &&
                  submittingIntent === "update" &&
                  submittingId === String(row.id);
                const rowIsDeleting =
                  isSubmitting &&
                  submittingIntent === "delete" &&
                  submittingId === String(row.id);
                const rowIsBusy = rowIsUpdating || rowIsDeleting;

                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
                  >
                    <Form
                      method="post"
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                    >
                      <input type="hidden" name="id" value={row.id} />

                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Name
                        </label>
                        <input
                          defaultValue={row.name}
                          name="name"
                          required
                          disabled={rowIsBusy}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Email
                        </label>
                        <input
                          defaultValue={row.email}
                          name="email"
                          required
                          disabled={rowIsBusy}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-3 flex items-center justify-end gap-2">
                        <button
                          type="submit"
                          name="intent"
                          value="update"
                          disabled={rowIsBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Save changes"
                        >
                          {rowIsUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil size={16} />
                          )}
                          <span className="hidden sm:inline">
                            {rowIsUpdating ? "Saving..." : "Save"}
                          </span>
                        </button>

                        <button
                          type="submit"
                          name="intent"
                          value="delete"
                          disabled={rowIsBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100/70 dark:hover:bg-red-900/30 px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Delete row"
                        >
                          {rowIsDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          <span className="hidden sm:inline">
                            {rowIsDeleting ? "Deleting..." : "Delete"}
                          </span>
                        </button>
                      </div>
                    </Form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
