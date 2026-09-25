import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { blogs } from "@/data/blogs";

interface BlogDetailsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogDetailsPage({
  params,
}: BlogDetailsPageProps) {
  const { slug } = await params;

  const blog = blogs.find((item) => item.slug === slug);

  if (!blog) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-background px-5">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-text">
            Blog not found
          </h1>

          <p className="mt-4 text-body text-text-secondary">
            The article you're looking for doesn't exist.
          </p>

          <Link
            href="/blog"
            className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            <ArrowLeft size={16} />
            Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background">
      <section className="px-5 pb-32 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-sm font-medium uppercase tracking-[0.02em] text-text-secondary">
            {blog.date}
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
            {blog.title}
          </h1>

          <div className="mt-12 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface">
            <div className="relative aspect-[4/3] w-full">
              {/* Placeholder image */}
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <p className="text-sm text-text-muted">
                  Blog cover image
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mx-auto mt-16 max-w-[560px]">
            <h2 className="text-2xl font-semibold tracking-heading text-text">
              This article is being written.
            </h2>

            <p className="mt-4 text-body leading-body tracking-body text-text-secondary">
              We're still putting this one together. Check back later for
              the full article, or explore some of our other posts in the
              meantime.
            </p>

            <Link
              href="/blog"
              className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <ArrowLeft size={16} />
              Back to blog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}