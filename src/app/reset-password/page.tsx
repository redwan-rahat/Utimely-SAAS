"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, CheckCircle2 } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import PasswordRequirements from "@/app/components/auth/PasswordRequirements";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordFocused, setPasswordFocused] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This password reset link is invalid or missing.");
      return;
    }

    if (!passwordValid) {
      setError(
        "Password must be at least 8 characters and contain an uppercase letter and a number.",
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (result.error) {
      setError(
        result.error.message ||
          "This reset link is invalid or has expired. Please request a new one.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={28} strokeWidth={1.8} />
        </div>

        <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.3px] text-text">
          Password updated
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-[18px] leading-[1.5] tracking-[-0.3px] text-text-secondary">
          Your password has been successfully reset. You can now sign in with
          your new password.
        </p>

        <Link
          href="/sign-in"
          className="mt-8 inline-flex h-[50px] items-center justify-center rounded-md bg-primary px-6 text-[16px] font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
          <LockKeyhole size={21} strokeWidth={1.8} />
        </div>

        <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.3px] text-text">
          Set a new password
        </h1>

        <p className="mt-3 text-[18px] leading-[1.5] tracking-[-0.3px] text-text-secondary">
          Choose a new password for your Utimely account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-[15px] font-medium text-text"
          >
            New password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setPasswordFocused(true)}
              placeholder="Enter your new password"
              autoComplete="new-password"
              required
              className="h-[48px] w-full rounded-md border border-border bg-surface px-4 pr-12 text-[16px] text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
            />

            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-0 top-0 flex h-[48px] w-12 items-center justify-center text-text-muted transition-colors hover:text-text"
            >
              {showPassword ? (
                <EyeOff size={19} strokeWidth={1.8} />
              ) : (
                <Eye size={19} strokeWidth={1.8} />
              )}
            </button>
          </div>

          <PasswordRequirements
            password={password}
            show={passwordFocused}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-[15px] font-medium text-text"
          >
            Confirm password
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your new password"
              autoComplete="new-password"
              required
              className={`h-[48px] w-full rounded-md border bg-surface px-4 pr-12 text-[16px] text-text outline-none transition-colors placeholder:text-text-muted ${
                confirmPassword.length === 0
                  ? "border-border focus:border-primary"
                  : passwordsMatch
                    ? "border-success focus:border-success"
                    : "border-danger focus:border-danger"
              }`}
            />

            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
              className="absolute right-0 top-0 flex h-[48px] w-12 items-center justify-center text-text-muted transition-colors hover:text-text"
            >
              {showConfirmPassword ? (
                <EyeOff size={19} strokeWidth={1.8} />
              ) : (
                <Eye size={19} strokeWidth={1.8} />
              )}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div
              className={`mt-2 flex items-center gap-2 text-[14px] ${
                passwordsMatch ? "text-success" : "text-danger"
              }`}
            >
              {passwordsMatch ? (
                <>
                  <span>✓</span>
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <span>✕</span>
                  <span>Passwords do not match</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-[14px] leading-[1.5] text-danger">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="h-[50px] w-full rounded-md bg-primary px-5 text-[16px] font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Updating password..." : "Update password"}
        </button>

        <p className="pt-1 text-center text-[15px] text-text-secondary">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-text underline underline-offset-2 transition-colors hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] items-center px-6 py-12">
        <div className="w-full rounded-xl bg-surface p-8 sm:p-10">
          <Link
            href="/"
            className="mb-10 inline-block text-[22px] font-bold tracking-[-0.3px]"
          >
            <span className="text-text">U</span>
            <span className="text-primary">timely</span>
          </Link>

          <Suspense
            fallback={
              <div className="text-[16px] text-text-secondary">
                Loading...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}