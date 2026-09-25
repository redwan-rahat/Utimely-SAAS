'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { usePathname } from 'next/navigation';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Features', href: '/#features' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();

  const hideNavbar =
    pathname.startsWith('/dashboard') ||
    pathname === '/sign-in' ||
    pathname === '/sign-up';

  if (hideNavbar) {
    return null;
  }

  return (
    <footer className="border-t border-[var(--color-border)] bg-surface">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-20">
          {/* Brand */}
          <div className="lg:pr-8">
            <Link href="/" className="inline-block">
              <Image
                alt="Utimely Logo"
                className="w-[104px]"
                src="/utimely.webp"
                height={500}
                width={500}
              />
            </Link>

            <p className="mt-5 max-w-[280px] text-sm leading-6 text-text-secondary">
              A simpler way to set goals, stay focused, and make progress.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="#"
                aria-label="Utimely on X"
                className="text-text-muted transition-colors hover:text-text"
              >
                <FaXTwitter size={18} />
              </a>

              <a
                href="#"
                aria-label="Utimely on GitHub"
                className="text-text-muted transition-colors hover:text-text"
              >
                <FaGithub size={18} />
              </a>

              <a
                href="#"
                aria-label="Utimely on LinkedIn"
                className="text-text-muted transition-colors hover:text-text"
              >
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-text">
                {column.title}
              </h3>

              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] py-6 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Utimely. All rights reserved.</p>

          <p>Built to help you make time count.</p>
        </div>
      </div>
    </footer>
  );
}
