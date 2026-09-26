import Link from "next/link";
import HeroFeatures from "./HeroFeatures";
import ProductDemo from "./ProductDemo";
import ProcessSection from "./ProcessSection";
import PlatformShowcase from "./PlatformShowcase";
import FAQSection from "./FAQSection";

export default function HeroSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-6 lg:px-8">
        {/* Hero Content */}
        <div className="grid min-h-[460px] items-center gap-0 lg:gap-10 py-16 sm:py-20 lg:grid-cols-[1.55fr_0.65fr] lg:gap-16 lg:py-24">
          {/* Left */}
          <div className="">
            <h1 className="max-w-[760px] text-[48px] font-semibold leading-heading tracking-heading text-text sm:text-[60px] lg:text-[76px]">
              Build a better
              <br />
              relationship with
              <br />
              your <span className="text-primary">time.</span>
            </h1>

            {/* Buttons */}
            <div className="mt-8 lg:mt-12 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-in"
                className="rounded-md bg-primary px-5 py-3.5 text-button font-medium leading-body tracking-body text-white transition-colors hover:bg-primary-hover"
              >
                Start your timer
              </Link>

              <a
                href="#process-section"
                className="rounded-md bg-secondary px-5 py-3.5 text-button font-medium leading-body tracking-body text-text transition-colors hover:bg-secondary-hover"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right */}
          <div className="max-w-[280px] mt-10 lg:ml-auto">
            <p className="text-body leading-body tracking-body text-text">
              Give your ADHD brain a simpler way to set goals, stay focused,
              and actually make progress.
            </p>
          </div>
        </div>

        {/* Features */}
        <div id="features">
          <HeroFeatures />
        </div>

        <div id="video-showcase">
        <ProductDemo></ProductDemo>
        </div>j
        <div>
          <PlatformShowcase></PlatformShowcase>
        </div>

        <div id="process-section">
        <ProcessSection></ProcessSection>
        </div>

        <div id="faq">
        <FAQSection></FAQSection>
        </div>
      </div>
    </section>
  );
}