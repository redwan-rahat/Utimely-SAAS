const faqs = [
  {
    question: "What is Utimely?",
    answer:
      "Utimely is a simple productivity app that helps you turn goals into tasks, focus with a timer, schedule upcoming work, and understand how you're spending your time.",
  },
  {
    question: "Who is Utimely made for?",
    answer:
      "Utimely is designed for people who want a simpler way to organize their goals, stay focused on their tasks, and make consistent progress without a complicated productivity system.",
  },
  {
    question: "Can I use Utimely on my phone?",
    answer:
      "Yes. Utimely is web-based, so you can access your goals, tasks, timer, and progress from both your desktop and mobile devices.",
  },
  {
    question: "Can I track the time I spend on tasks?",
    answer:
      "Yes. You can use the built-in timer to focus on a task and keep track of the time you spend working. Your tracked time can then be viewed as part of your overall progress.",
  },
  {
    question: "Can I schedule tasks for later?",
    answer:
      "Yes. You can schedule tasks for future dates so you can plan ahead while keeping your current work focused on what matters today.",
  },
  {
    question: "Does Utimely help me track my progress?",
    answer:
      "Yes. Utimely gives you an overview of your completed tasks and the time you've spent working, helping you understand your progress over time.",
  },
];

export default function FAQSection() {
  return (
    <section className="bg-background py-28 sm:py-32 lg:py-36">
      <div className="mx-auto w-full max-w-[800px] px-5 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center m-auto">

          <h2 className="mt-3 mx-auto max-w-[500px] text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
            Everything you need to know.
          </h2>

          <p className="mx-auto mt-5 max-w-[450px] text-body leading-body tracking-body text-text-secondary">
            Have questions about Utimely? Here are some answers to help you
            get started.
          </p>
        </div>

        {/* FAQ */}
{/* FAQ */}
<div className="mt-14 space-y-1 text-left">
  {faqs.map((faq) => (
    <details
      key={faq.question}
      className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-surface transition-colors hover:border-[var(--color-border-hover)] hover:bg-surface-hover"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-lg font-medium tracking-heading text-text marker:hidden sm:px-6 sm:py-6">
        <span>{faq.question}</span>

        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary transition-colors group-open:bg-primary group-open:text-white">
          <span className="absolute h-px w-3 bg-current" />

          <span className="absolute h-3 w-px bg-current transition-transform duration-200 group-open:rotate-90" />
        </span>
      </summary>

      <div className="max-w-[680px] px-5 pb-6 pr-12 text-body leading-body tracking-body text-text-secondary sm:px-6 sm:pb-6">
        {faq.answer}
      </div>
    </details>
  ))}
</div>
      </div>
    </section>
  );
}