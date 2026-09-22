'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function DashboardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/* Today's Tasks */
function TodayTasksIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12l1.5 1.5L12 11" />
      <path d="M8 16h8" />
    </svg>
  );
}

/* All Tasks */
function TasksIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l2 2 4-4" />
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-9" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6V11.6h.8a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.4v.7a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.8V14h-.8a1.7 1.7 0 0 0-1.6 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  /*
   * Get today's date in Bangladesh time.
   *
   * Example:
   * 2026-09-22
   */
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date());

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: DashboardIcon,
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: CalendarIcon,
    },
    {
      name: "Today's Tasks",
      href: `/dashboard/calendar/${today}`,
      icon: TodayTasksIcon,
    },
    {
      name: 'All Tasks',
      href: '/dashboard/tasks',
      icon: TasksIcon,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: AnalyticsIcon,
    },
  ];

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/auth';
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--color-border)] bg-[var(--color-background)] lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center px-6">
        <Link
          href="/dashboard"
          className="text-2xl font-semibold tracking-tight text-[var(--color-text)]"
        >
          Uti
          <span className="text-[var(--color-primary)]">
            mely
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            /*
             * Calendar should only be active on the
             * main calendar page.
             */
            const isActive =
              item.name === 'Calendar'
                ? pathname === '/dashboard/calendar'
                : item.name === 'Dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-[var(--color-border)] p-4">
        <Link
          href="/dashboard/settings"
          className={`mb-1 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname.startsWith('/dashboard/settings')
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
          }`}
        >
          <SettingsIcon />
          <span>Settings</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}