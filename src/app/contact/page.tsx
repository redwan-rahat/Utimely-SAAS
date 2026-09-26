import ContactForm from "../components/contact/ContactForm";



export default function ContactPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="px-5 sm:px-6 pb-16 pt-40">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary">
            <span className="text-primary">✦</span>
            CONTACT
          </div>

          <h1 className="mt-7 text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
            Get in touch.
          </h1>

          <p className="mx-auto mt-5 max-w-[500px] text-body leading-body tracking-body text-text-secondary">
            Have a question, feedback, or something you&apos;d like to share?
            We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-5 pb-28 sm:px-6 sm:pb-32 lg:pb-36">
        <div className="mx-auto max-w-[760px]">
          <ContactForm />

        </div>
      </section>
    </main>
  );
}