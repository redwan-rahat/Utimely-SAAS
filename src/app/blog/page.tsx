import BlogGrid from '../components/blog/BlogGrid';

export default function BlogPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="px-5 pb-16 pt-40 sm:px-6">
        <div className="mx-auto space-y-8 max-w-[900px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary">
            <span className="text-primary">✦</span>
            BLOG
          </div>

          <div>
            <h1 className="mt-3 max-w-[500px] mx-auto text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
              Ideas for better work and better focus.
            </h1>

            <p className="mx-auto mt-5 max-w-[420px] text-body leading-body tracking-body text-text-secondary">
              Practical ideas about goals, focus, time, and building
              productivity system that works for you.
            </p>
          </div>

        </div>
      </section>

      {/* Blog Grid */}
      <section className="px-5 pb-28 sm:px-6 sm:pb-32 lg:pb-36">
        <div className="mx-auto max-w-[1200px]">
          <BlogGrid />
        </div>
      </section>
    </main>
  );
}
