import { useState } from "react";
import { supabase } from "~/lib/supabase.client";
import { useNavigate, Link } from "react-router";
import { Loader2, UserPlus } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<
    "idle" | "signing-up" | "redirecting" | "check-email"
  >("idle");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("signing-up");

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setStatus("idle");
      return;
    }

    // If email confirmations are enabled, Supabase returns no session.
    if (!data.session) {
      setStatus("check-email");
      return;
    }

    setStatus("redirecting");
    navigate("/users");
  }

  const isBusy = status === "signing-up" || status === "redirecting";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/10 dark:shadow-none p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Create account
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign up to get started
              </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isBusy || status === "check-email"}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isBusy || status === "check-email"}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use at least 8 characters.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {status === "check-email" && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                Account created. Please check your email to confirm your account,
                then come back and sign in.
              </div>
            )}

            {(status === "signing-up" || status === "redirecting") && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>
                  {status === "signing-up"
                    ? "Creating your account..."
                    : "Redirecting to dashboard..."}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy || status === "check-email"}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium py-2.5 px-4 transition focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {status === "signing-up" ? "Signing up..." : "Redirecting..."}
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
