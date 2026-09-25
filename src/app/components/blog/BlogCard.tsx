import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  slug: string;
  title: string;
  date: string;
  image: string;
}

export default function BlogCard({
  slug,
  title,
  date,
  image,
}: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-surface">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="mt-5">
        <h2 className="text-xl font-medium leading-heading tracking-heading text-text transition-colors group-hover:text-primary">
          {title}
        </h2>

        <p className="mt-3 text-sm text-text-muted">
          {date}
        </p>
      </div>
    </Link>
  );
}