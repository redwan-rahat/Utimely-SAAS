"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (result.error) {
      setError(
        result.error.message ||
          "Something went wrong. Please try again.",
      );
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-[22px] font-bold leading-heading tracking-heading"
          >
            <span className="text-black">U</span>
            <span className="text-primary">timely</span>
          </Link>

          <Link
            href="/sign-in"
            className="text-nav font-medium text-text-secondary transition-colors hover:text-primary"
          >
            Sign in
          </Link>
        </header>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px]">
            {!sent ? (
              <>
                {/* Icon */}
                <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-md bg-primary-light text-primary">
                  <Mail size={20} strokeWidth={1.8} />
                </div>

                {/* Heading */}
                <div className="mb-8">
                  <h1 className="text-[34px] font-semibold leading-heading tracking-heading text-text sm:text-[38px]">
                    Forgot your password?
                  </h1>

                  <p className="mt-3 text-body leading-body tracking-body text-text-secondary">
                    Enter your email and we&apos;ll send you a link to reset
                    your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[15px] font-medium text-text"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="h-[48px] w-full rounded-md border border-border bg-surface px-4 text-[16px] text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
                    />
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
                    {isLoading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                {/* Back */}
                <div className="mt-7 text-center">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 text-[15px] font-medium text-text-secondary transition-colors hover:text-primary"
                  >
                    <ArrowLeft size={16} strokeWidth={1.8} />
                    Back to sign in
                  </Link>
                </div>
              </>
            ) : (
              /* Success */
              <div className="text-center">
                <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Mail size={21} strokeWidth={1.8} />
                </div>

                <h1 className="text-[34px] font-semibold leading-heading tracking-heading text-text sm:text-[38px]">
                  Check your email
                </h1>

                <p className="mt-4 text-body leading-body tracking-body text-text-secondary">
                  If an account exists for{" "}
                  <span className="font-medium text-text">{email}</span>, we
                  sent you a password reset link.
                </p>

                <p className="mt-4 text-[14px] leading-[1.5] text-text-muted">
                  Didn&apos;t receive it? Check your spam folder or try again
                  in a few minutes.
                </p>

                <Link
                  href="/sign-in"
                  className="mt-7 inline-flex items-center gap-2 text-[15px] font-medium text-text transition-colors hover:text-primary"
                >
                  <ArrowLeft size={16} strokeWidth={1.8} />
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-[13px] leading-[1.5] text-text-muted">
            By continuing, you agree to Utimely&apos;s{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-text"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-text"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}