'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Eye, EyeOff, LogOut, Save, ShieldCheck, Trash2 } from 'lucide-react';
import ConfirmModal from '@/app/components/ui/ConfirmModal';
import PasswordRequirements from '@/app/components/auth/PasswordRequirements';

export default function SettingsPage() {
  const router = useRouter();

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const [name, setName] = useState('');

  const [savingName, setSavingName] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState('');
  const [newPassword, setNewPassword] =
    useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /*
   * Initialize the name from the Better Auth session
   * once the session has loaded.
   */
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? '');
    }
  }, [session?.user]);

  /* =======================================================
     SAVE NAME
  ======================================================= */

  async function handleSaveName() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Name cannot be empty.');
      setSuccess('');
      return;
    }

    if (
      trimmedName === session?.user?.name
    ) {
      return;
    }

    try {
      setSavingName(true);
      setError('');
      setSuccess('');

      const { error } =
        await authClient.updateUser({
          name: trimmedName,
        });

      if (error) {
        throw new Error(
          error.message ||
            'Failed to update name.',
        );
      }

      setSuccess(
        'Your name has been updated.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update name.',
      );
    } finally {
      setSavingName(false);
    }
  }

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!currentPassword) {
      setError(
        'Please enter your current password.',
      );
      setSuccess('');
      return;
    }

    if (!newPassword) {
      setError(
        'Please enter a new password.',
      );
      setSuccess('');
      return;
    }

    if (newPassword.length < 8) {
      setError(
        'New password must be at least 8 characters.',
      );
      setSuccess('');
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        'New passwords do not match.',
      );
      setSuccess('');
      return;
    }

    try {
      setChangingPassword(true);
      setError('');
      setSuccess('');

      const { error } =
        await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });

      if (error) {
        throw new Error(
          error.message ||
            'Failed to change password.',
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setSuccess(
        'Your password has been changed.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to change password.',
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* =======================================================
     LOG OUT
  ======================================================= */

  async function handleLogout() {
    try {
      setError('');

      const { error } =
        await authClient.signOut();

      if (error) {
        throw new Error(
          error.message ||
            'Failed to log out.',
        );
      }

      router.push('/login');
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to log out.',
      );
    }
  }

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  async function handleDeleteAccount() {
    try {
      setDeletingAccount(true);
      setError('');
      setSuccess('');

      const { error } =
        await authClient.deleteUser();

      if (error) {
        throw new Error(
          error.message ||
            'Failed to delete account.',
        );
      }

      router.push('/login');
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete account.',
      );
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (isPending) {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
        Loading settings...
      </div>
    );
  }

  /* =======================================================
     NO SESSION
  ======================================================= */

  if (!session?.user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          You are not signed in.
        </p>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Go to login
        </button>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="max-w-3xl space-y-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
          Settings
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Account settings
        </h1>

        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Manage your Utimely account.
        </p>
      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)] shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[var(--radius-md)] border border-green-200 bg-green-50 px-4 py-3 text-sm text-[var(--color-success)] shadow-sm">
          {success}
        </div>
      )}

      {/* =================================================
          ACCOUNT
      ================================================= */}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Account
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Update your personal information.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {/* NAME */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="Your name"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSaveName}
                disabled={
                  savingName ||
                  !name.trim() ||
                  name.trim() ===
                    session.user.name
                }
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingName ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={15} strokeWidth={1.8} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* EMAIL */}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={session.user.email}
              disabled
              readOnly
              className="w-full cursor-not-allowed rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-secondary)] outline-none"
            />

            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Email address cannot be changed.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          PASSWORD
      ================================================= */}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Password
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Change your account password.
          </p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="mt-6 space-y-4"
        >
          {/* CURRENT PASSWORD */}

          <div>
            <label
              htmlFor="currentPassword"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              Current password
            </label>

            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 pr-11 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrentPassword((value) => !value)
                }
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                aria-label={
                  showCurrentPassword
                    ? 'Hide current password'
                    : 'Show current password'
                }
              >
                {showCurrentPassword ? (
                  <EyeOff size={17} strokeWidth={1.8} />
                ) : (
                  <Eye size={17} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          {/* NEW PASSWORD */}

          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              New password
            </label>

            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 pr-11 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword((value) => !value)
                }
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                aria-label={
                  showNewPassword
                    ? 'Hide new password'
                    : 'Show new password'
                }
              >
                {showNewPassword ? (
                  <EyeOff size={17} strokeWidth={1.8} />
                ) : (
                  <Eye size={17} strokeWidth={1.8} />
                )}
              </button>
            </div>

            <PasswordRequirements
              password={newPassword}
              show={newPassword.length > 0}
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              Confirm new password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 pr-11 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} strokeWidth={1.8} />
                ) : (
                  <Eye size={17} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword
                ? 'Changing...'
                : 'Change password'}
            </button>
          </div>
        </form>
      </section>

      {/* =================================================
          ACCOUNT ACTIONS
      ================================================= */}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Account actions
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Manage your account session and
            account data.
          </p>
        </div>

        <div className="mt-6 divide-y divide-[var(--color-border)]">
          {/* LOG OUT */}

          <div className="flex items-center justify-between gap-6 pb-5">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                Log out
              </h3>

              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Sign out of your Utimely account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            >
              <LogOut size={15} strokeWidth={1.8} />
              Log out
            </button>
          </div>

          {/* DELETE */}

          <div className="flex items-center justify-between gap-6 pt-5">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                Delete account
              </h3>

              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Permanently delete your account
                and associated data.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowDeleteModal(true)
              }
              disabled={deletingAccount}
              className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-danger)] shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={15} strokeWidth={1.8} />
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          DELETE ACCOUNT MODAL
      ================================================= */}

      <ConfirmModal
        open={showDeleteModal}
        title="Delete your account?"
        description="Your account and associated data will be permanently deleted. This action cannot be undone."
        confirmText="Delete account"
        cancelText="Cancel"
        loading={deletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}