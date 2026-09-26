import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="grid min-h-screen lg:grid-cols-[42%_58%]">
        {/* Left */}
        <section className="flex min-h-screen flex-col border-r border-border bg-surface">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="text-[24px] font-bold leading-heading tracking-heading"
            >
              {/* <span className="text-black">U</span>
              <span className="text-primary">timely</span> */}
              <Image
                alt="utimely Logo"
                className="w-[104px]"
                src="/utimely.webp"
                height={500}
                width={500}
              ></Image>
            </Link>

            <Link
              href="/"
              className="text-nav font-medium text-text-secondary transition-colors hover:text-primary lg:hidden"
            >
              Back
            </Link>
          </div>

          {/* Form */}
          <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
            <div className="w-full max-w-[420px]">
              <div className="mb-8">
                <h1 className="text-[34px] font-semibold leading-heading tracking-heading text-text sm:text-[38px]">
                  {title}
                </h1>

                <p className="mt-3 text-body leading-body tracking-body text-text-secondary">
                  {subtitle}
                </p>
              </div>

              {children}

              <div className="mt-7 text-center text-nav leading-body tracking-body text-text-secondary">
                {footer}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center sm:px-8 lg:px-10">
            <p className="mx-auto max-w-[400px] text-[13px] leading-[1.5] text-text-muted">
              By continuing, you agree to Utimely&apos;s{' '}
              <Link
                href="/"
                className="underline underline-offset-2 hover:text-text"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/"
                className="underline underline-offset-2 hover:text-text"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Right */}
<section className="relative hidden overflow-hidden bg-background lg:flex lg:items-center lg:justify-center">
  <div className="w-full max-w-[700px] px-12 xl:px-20">
    {/* Quote mark */}
    <div className="mb-8 font-serif text-[70px] leading-[0.6] text-primary/15">
      “
    </div>

    {/* Question */}
    <div>
      <p className="text-[16px] font-semibold tracking-[-0.2px] text-text">
        I once asked my grandfather:
      </p>

      <p className="mt-2 max-w-[620px] text-[32px] font-medium leading-[1.2] tracking-[-0.8px] text-text xl:text-[36px]">
        Why do some people always seem ahead?
      </p>
    </div>

    {/* Answer */}
    <div className="mt-9">
      <p className="text-[16px] font-semibold tracking-[-0.2px] text-text">
        He replied:
      </p>

      <p className="mt-2 max-w-[620px] text-[32px] font-medium leading-[1.2] tracking-[-0.8px] text-text xl:text-[36px]">
        Because they guard their time like <span className='text-primary'>it&apos;s already running out.</span>
      </p>
    </div>

    {/* Speaker */}
    <div className="mt-10 flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-[16px] font-semibold text-white">
        S
      </div>

      <div>
        <p className="text-[15px] font-medium text-text">
          Silent Thunder
        </p>

        <p className="mt-0.5 text-[14px] text-text-muted">
          The Pathfinder
        </p>
      </div>
    </div>
  </div>
</section>
      </div>
    </main>
  );
}
