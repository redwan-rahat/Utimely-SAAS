import BlogGrid from "../components/blog/BlogGrid";

export default function BlogPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="px-5 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-sm font-medium uppercase tracking-[0.02em] text-text-secondary">
            Utimely Blog
          </p>

          <h1 className="mt-3 text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
            Ideas for better work and better focus.
          </h1>

          <p className="mx-auto mt-5 max-w-[620px] text-body leading-body tracking-body text-text-secondary">
            Practical ideas about goals, focus, time, and building a
            productivity system that works for you.
          </p>
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