"use client";

import { FormEvent, useRef, useState } from "react";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

export default function ContactForm() {
  const form = useRef<HTMLFormElement>(null);

  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({
    type: "",
    message: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.current || isSending) return;

    setIsSending(true);
    setStatus({
      type: "",
      message: "",
    });

    try {
      await emailjs.sendForm(
        SERVICE_ID,
        TEMPLATE_ID,
        form.current,
        {
          publicKey: PUBLIC_KEY,
        }
      );

      setStatus({
        type: "success",
        message: "Your message has been sent. We'll get back to you soon.",
      });

      form.current.reset();
    } catch (error) {
      console.error("EmailJS Error:", error);

      setStatus({
        type: "error",
        message: "Something went wrong. Please try again in a moment.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      ref={form}
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-surface p-6 sm:p-8 lg:p-10"
    >
      {/* Name + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-base font-medium text-text"
          >
            Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            required
            className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-background px-4 text-base text-text outline-none transition-colors placeholder:text-base placeholder:text-text-secondary focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-base font-medium text-text"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-background px-4 text-base text-text outline-none transition-colors placeholder:text-base placeholder:text-text-secondary focus:border-primary"
          />
        </div>
      </div>

      {/* Topic */}
      <div className="mt-5">
        <label
          htmlFor="topic"
          className="mb-2 block text-base font-medium text-text"
        >
          What can we help you with?
        </label>

        <select
          id="topic"
          name="topic"
          defaultValue=""
          required
          className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-background px-4 text-base text-text outline-none transition-colors focus:border-primary"
        >
          <option value="" disabled>
            Select a topic
          </option>
          <option value="General question">General question</option>
          <option value="Feedback">Feedback</option>
          <option value="Bug report">Bug report</option>
          <option value="Feature request">Feature request</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div className="mt-5">
        <label
          htmlFor="message"
          className="mb-2 block text-base font-medium text-text"
        >
          Message
        </label>

        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us a little more about how we can help..."
          required
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-background px-4 py-3 text-base leading-6 text-text outline-none transition-colors placeholder:text-base placeholder:text-text-secondary focus:border-primary"
        />
      </div>

      {/* Status */}
      {status.message && (
        <div
          className={`mt-5 rounded-[var(--radius-md)] border px-4 py-3 text-base ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSending}
        className="mt-6 h-12 w-full rounded-[var(--radius-md)] bg-primary px-6 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}