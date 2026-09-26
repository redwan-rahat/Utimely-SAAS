import { CalendarDays } from "lucide-react";

const changelog = [
  {
    version: "Version 0.1",
    date: "SEP 25, 2026",
    sections: [
      {
        title: "Features",
        items: [
          "Added goal creation and goal tracking.",
          "Added a built-in focus timer for focused work sessions.",
          "Added task creation, completion, and task tracking.",
          "Added task scheduling for future dates.",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Added analytics to help visualize time and task progress.",
          "Added a responsive dashboard experience for desktop and mobile.",
        ],
      },
      {
        title: "Fixes",
        items: [
          "Improved task state handling across the dashboard.",
          "Fixed several UI and navigation issues.",
        ],
      },
    ],
  },
  {
    version: "Version 0.0.2",
    date: "JULY 18, 2026",
    sections: [
      {
        title: "Features",
        items: [
          "Added scheduled task management.",
          "Added calendar-based task views.",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Improved task organization and filtering.",
          "Refined the dashboard experience.",
        ],
      },
      {
        title: "Fixes",
        items: [
          "Fixed issues with task assignment and status updates.",
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="px-5 pb-16 pt-40 sm:px-6">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary">
            <span className="text-primary">✦</span>
            CHANGELOG
          </div>

          <h1 className="mt-7 text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
            What's new in Utimely?
          </h1>

          <p className="mx-auto mt-5 max-w-[620px] text-body leading-body tracking-body text-text-secondary">
            New features, improvements, and fixes as we keep making Utimely
            better.
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section className="px-5 pb-28 sm:px-6 sm:pb-32 lg:pb-36">
        <div className="mx-auto max-w-[760px] space-y-6">
          {changelog.map((release) => (
            <article
              key={release.version}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] sm:p-8"
            >
              {/* Date */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary">
                <CalendarDays
                  size={15}
                  strokeWidth={1.8}
                  className="text-primary"
                />

                <span>{release.date}</span>
              </div>

              {/* Version */}
              <h2 className="mt-6 text-3xl font-semibold leading-heading tracking-heading text-text sm:text-4xl">
                {release.version}
              </h2>

              {/* Release sections */}
              <div className="mt-8 space-y-8">
                {release.sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-lg font-semibold tracking-heading text-text">
                      {section.title}
                    </h3>

                    <ul className="mt-3 space-y-1.5">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="text-body leading-body tracking-body text-text-secondary"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}