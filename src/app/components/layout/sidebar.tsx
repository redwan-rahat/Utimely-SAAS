'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LuLayoutDashboard,
  LuCalendarDays,
  LuListChecks,
  LuLayers3,
  LuChartNoAxesColumn,
  LuSettings,
  LuLogOut,
  LuMenu,
  LuX,
} from 'react-icons/lu';
import { authClient } from '@/lib/auth-client';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const today = new Intl.DateTimeFormat('en-CA').format(new Date());

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LuLayoutDashboard,
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: LuCalendarDays,
    },
    {
      name: "Today's Tasks",
      href: `/dashboard/calendar/${today}`,
      icon: LuListChecks,
    },
    {
      name: 'All Tasks',
      href: '/dashboard/tasks',
      icon: LuLayers3,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: LuChartNoAxesColumn,
    },
  ];

  const isActive = (item: (typeof navigation)[number]) => {
    if (item.name === 'Dashboard') {
      return pathname === '/dashboard';
    }

    if (item.name === 'Calendar') {
      return pathname === '/dashboard/calendar';
    }

    if (item.name === "Today's Tasks") {
      return pathname === item.href;
    }

    return pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile / tablet backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/10 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-border bg-surface
          transition-[width] duration-200 ease-out

          /* Desktop: unchanged */
          lg:w-64

          /* Tablet / mobile */
          ${mobileOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* ========================================
            MOBILE / TABLET HEADER
            ======================================== */}

        <div
          className={`
            flex h-20 shrink-0 items-center
            lg:hidden
            ${mobileOpen ? 'justify-between px-5' : 'justify-center'}
          `}
        >
          {mobileOpen ? (
            <>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="text-[24px] font-bold tracking-[-0.3px]"
              >
                <span className="text-text">U</span>
                <span className="text-primary">timely</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
                className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text"
              >
                <LuX size={20} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
            >
              <LuMenu size={21} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* ========================================
            DESKTOP LOGO
            ======================================== */}

        <div className="hidden h-20 shrink-0 items-center px-6 lg:flex">
          <Link
            href="/"
            className="text-[24px] font-bold tracking-[-0.3px]"
          >
            <span className="text-text">U</span>
            <span className="text-primary">timely</span>
          </Link>
        </div>

        {/* ========================================
            NAVIGATION
            ======================================== */}

        <nav
          className={`
            flex-1
            ${mobileOpen ? 'px-4' : 'px-3'}
            lg:px-4
          `}
        >
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileOpen(false)}
                  title={!mobileOpen ? item.name : undefined}
                  className={`
                    flex h-10 items-center rounded-md
                    text-[15px] font-medium
                    transition-colors

                    ${mobileOpen ? 'gap-3 px-3' : 'justify-center px-0'}

                    ${
                      active
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                    }

                    lg:justify-start lg:gap-3 lg:px-3
                  `}
                >
                  <Icon size={19} strokeWidth={1.8} className="shrink-0" />

                  <span
                    className={`
                      ${mobileOpen ? 'block' : 'hidden'}
                      lg:block
                    `}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ========================================
            BOTTOM ACTIONS
            ======================================== */}

        <div
          className={`
            shrink-0 pb-5
            ${mobileOpen ? 'px-4' : 'px-3'}
            lg:px-4
          `}
        >
          {/* Settings */}

          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            title={!mobileOpen ? 'Settings' : undefined}
            className={`
              mb-1 flex h-10 items-center rounded-md
              text-[15px] font-medium
              transition-colors

              ${mobileOpen ? 'gap-3 px-3' : 'justify-center px-0'}

              ${
                pathname.startsWith('/dashboard/settings')
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }

              lg:justify-start lg:gap-3 lg:px-3
            `}
          >
            <LuSettings size={19} strokeWidth={1.8} className="shrink-0" />

            <span
              className={`
                ${mobileOpen ? 'block' : 'hidden'}
                lg:block
              `}
            >
              Settings
            </span>
          </Link>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            title={!mobileOpen ? 'Logout' : undefined}
            className={`
              flex h-10 w-full items-center rounded-md
              text-[15px] font-medium
              text-text-secondary
              transition-colors
              hover:bg-surface-hover hover:text-text

              ${mobileOpen ? 'gap-3 px-3' : 'justify-center px-0'}

              lg:justify-start lg:gap-3 lg:px-3
            `}
          >
            <LuLogOut size={19} strokeWidth={1.8} className="shrink-0" />

            <span
              className={`
                ${mobileOpen ? 'block' : 'hidden'}
                lg:block
              `}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
