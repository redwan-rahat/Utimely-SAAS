'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const processes = [
  {
    number: '01',
    title: 'Set your goals',
    description:
      'Turn the things you want to accomplish into clear goals and give yourself something meaningful to work on.',
    image: '/images/process-01.png',
    alt: 'Utimely goals view',
  },
  {
    number: '02',
    title: 'Focus on the work',
    description:
      'Break your goals into manageable tasks, choose what matters now, and use the timer to stay focused.',
    image: '/images/process-02.png',
    alt: 'Utimely task and timer view',
  },
  {
    number: '03',
    title: 'See your progress',
    description:
      'Track completed tasks and time spent working so you can understand your progress and keep moving.',
    image: '/images/process-03.png',
    alt: 'Utimely analytics view',
  },
];

export default function ProcessSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const processRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      processRefs.current.forEach((element, index) => {
        if (!element) return;

        const rect = element.getBoundingClientRect();

        // Find the process whose section is closest to the
        // middle of the viewport.
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const activeProcess = processes[activeIndex];

  return (
    <section className="bg-background pt-32 sm:pt-44 lg:pt-48">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-0">


        {/* Process */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Sticky Content */}
          <div className="hidden lg:block">
            <div className="sticky top-28 flex min-h-[400px] items-center">
              <div className="max-w-[500px]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                  {activeProcess.number}
                </div>

                <h3 className="mt-7 text-3xl font-semibold leading-heading tracking-heading text-text sm:text-4xl">
                  {activeProcess.title}
                </h3>

                <p className="mt-5 max-w-[460px] text-body leading-body tracking-body text-text-secondary">
                  {activeProcess.description}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="lg:hidden">
            {processes.map((process) => (
              <div key={process.number} className="mb-16 last:mb-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                  {process.number}
                </div>

                <h3 className="mt-6 text-3xl font-semibold leading-heading tracking-heading text-text">
                  {process.title}
                </h3>

                <p className="mt-4 text-body leading-body tracking-body text-text-secondary">
                  {process.description}
                </p>

                <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={process.image}
                      alt={process.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Scrolling Images */}
          <div className="hidden lg:block">
            {processes.map((process, index) => (
              <div
                key={process.number}
                ref={(element) => {
                  processRefs.current[index] = element;
                }}
                className="flex min-h-[70vh] items-center"
              >
                <div className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={process.image}
                      alt={process.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
