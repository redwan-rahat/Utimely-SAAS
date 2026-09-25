'use client';

import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import PasswordRequirements from './PasswordRequirements';
import { useRouter } from 'next/navigation';

export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const passwordValid =
    password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!passwordValid) {
      setError(
        'Your password must be at least 8 characters and contain one uppercase letter and one number.',
      );
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: '/dashboard',
    });

    console.log('SIGNUP RESULT:', result);

    if (result.error) {
      setError(result.error.message || 'Unable to create your account.');
      setIsLoading(false);
      return;
    }

    router.push('/dashboard');

    // Better Auth handles the successful signup flow.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-[15px] font-medium text-text"
        >
          Name
        </label>

        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
          className="h-[48px] w-full rounded-md border border-border bg-surface px-4 text-[16px] text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
        />
      </div>

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

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-[15px] font-medium text-text"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onFocus={() => setPasswordFocused(true)}
            placeholder="Create a password"
            autoComplete="new-password"
            required
            className="h-[48px] w-full rounded-md border border-border bg-surface px-4 pr-12 text-[16px] text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
          />

          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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

        <PasswordRequirements password={password} show={passwordFocused} />
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-[15px] font-medium text-text"
        >
          Confirm password
        </label>

        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
            className={`h-[48px] w-full rounded-md border bg-surface px-4 pr-12 text-[16px] text-text outline-none transition-colors placeholder:text-text-muted ${
              confirmPassword.length > 0
                ? passwordsMatch
                  ? 'border-success focus:border-success'
                  : 'border-danger focus:border-danger'
                : 'border-border focus:border-primary'
            }`}
          />

          <button
            type="button"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirmPassword((previous) => !previous)}
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
              passwordsMatch ? 'text-success' : 'text-danger'
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
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
