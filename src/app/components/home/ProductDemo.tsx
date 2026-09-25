export default function ProductDemo() {
  return (
    <section className="bg-background pt-28 sm:pt-32 lg:pt-36">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="sm:flex items-end gap-6 justify-between">
          <h2 className="sm:text-h2 max-w-[600px] font-semibold leading-h2 tracking-h2 text-text text-4xl sm:text-5xl">
            See how Utimely helps you get things done.
          </h2>

          <p className="mt-5 pb-1 max-w-[400px] text-body leading-body tracking-body text-text-secondary">
            Set a goal, plan your tasks, start a focus session, and see your
            progress all in one place.
          </p>
        </div>

        {/* Video */}
        <div className="mt-12  overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface shadow-[0_2px_10px_rgba(0,0,0,0.04)] sm:mt-14">
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/DkUuOr21v4s"
              title="See how Utimely works"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}