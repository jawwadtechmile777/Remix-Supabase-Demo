import { useState } from "react";
import { supabase } from "~/lib/supabase.client";
import { useNavigate, Link } from "react-router";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "signing-in" | "redirecting">("idle");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("signing-in");

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }

    setStatus("redirecting");
    navigate("/users");
  }

  const isBusy = status !== "idle";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/10 dark:shadow-none p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Sign in
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your credentials to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isBusy}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isBusy}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {isBusy && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>
                  {status === "signing-in"
                    ? "Signing you in..."
                    : "Redirecting to dashboard..."}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium py-2.5 px-4 transition focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {status === "signing-in" ? "Signing in..." : "Redirecting..."}
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            No account?{" "}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
