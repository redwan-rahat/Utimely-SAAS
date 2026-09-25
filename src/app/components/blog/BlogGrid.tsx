import BlogCard from "./BlogCard";
import { blogs } from "@/data/blogs";

export default function BlogGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-16">
      {blogs.map((blog) => (
        <BlogCard
          key={blog.slug}
          slug={blog.slug}
          title={blog.title}
          date={blog.date}
          image={blog.image}
        />
      ))}
    </div>
  );
}