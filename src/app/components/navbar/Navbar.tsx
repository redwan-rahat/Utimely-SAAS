"use client";
import { FiMenu } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Fixed Navbar */}
      <header className="fixed inset-x-0 top-0 z-[9999] border-b border-border bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              onClick={closeMenu}
              className="text-[24px] font-bold leading-heading tracking-heading"
            >
              <span className="text-black">U</span>
              <span className="text-primary">timely</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-7 md:flex">
              <Link
                href="/"
                className="text-nav leading-body tracking-body font-medium text-text transition-colors hover:text-primary"
              >
                Home
              </Link>

              <Link
                href="/dashboard"
                className="text-nav leading-body tracking-body font-medium text-text transition-colors hover:text-primary"
              >
                Dashboard
              </Link>

              <Link
                href="/changelog"
                className="text-nav leading-body tracking-body font-medium text-text transition-colors hover:text-primary"
              >
                Changelog
              </Link>

              <Link
                href="/blog"
                className="text-nav leading-body tracking-body font-medium text-text transition-colors hover:text-primary"
              >
                Blog
              </Link>

              <Link
                href="/contact"
                className="text-nav leading-body tracking-body font-medium text-text transition-colors hover:text-primary"
              >
                Contact
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-4 md:flex">
              <Link
                href="/sign-in"
                className="text-nav leading-body tracking-body font-medium text-text  transition-colors hover:text-primary"
              >
                Sign in
              </Link>

              <Link
                href="/sign-in"
                className="rounded-md bg-primary px-4 py-2.5 text-nav leading-body tracking-body font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Start your timer
              </Link>
            </div>

            {/* Tablet + Mobile Menu Button */}
            <button
              type="button"
              aria-label={
                isOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-text transition-colors hover:bg-surface md:hidden"
            >
              {isOpen ? (
                <IoMdClose     className="text-4xl"/>
              ) : (
                <FiMenu    className="text-3xl"/>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tablet + Mobile Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="fixed inset-0 z-[9997] bg-transparent md:hidden"
          />

          {/* Menu Panel */}
          <div className="fixed inset-x-0 top-[72px] z-[9998] bg-white px-5 pb-6 shadow-sm sm:px-6 md:hidden">
            <nav className="mx-auto flex w-full max-w-[1200px] flex-col pt-3">
              <Link
                href="/"
                onClick={closeMenu}
                className="text-nav leading-body tracking-body py-3 font-medium text-text transition-colors hover:text-primary"
              >
                Home
              </Link>

              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="text-nav leading-body tracking-body py-3 font-medium text-text transition-colors hover:text-primary"
              >
                Dashboard
              </Link>

              <Link
                href="/changelog"
                onClick={closeMenu}
                className="text-nav leading-body tracking-body py-3 font-medium text-text transition-colors hover:text-primary"
              >
                Changelog
              </Link>

              <Link
                href="/blog"
                onClick={closeMenu}
                className="text-nav leading-body tracking-body py-3 font-medium text-text transition-colors hover:text-primary"
              >
                Blog
              </Link>

              <Link
                href="/contact"
                onClick={closeMenu}
                className="text-nav leading-body tracking-body py-3 font-medium text-text transition-colors hover:text-primary"
              >
                Contact
              </Link>

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/sign-in"
                  onClick={closeMenu}
                  className="text-nav leading-body tracking-body bg-secondary rounded-md border border-border px-4 py-3 text-center font-medium text-text transition-colors hover:bg-surface"
                >
                  Sign in
                </Link>

                <Link
                  href="/sign-in"
                  onClick={closeMenu}
                  className="text-nav leading-body tracking-body rounded-md bg-primary px-4 py-3 text-center font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Start your timer
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}