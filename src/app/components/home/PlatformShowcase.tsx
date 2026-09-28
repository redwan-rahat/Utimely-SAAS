import {
  SiAndroid,
  SiApple,
  SiFirefoxbrowser,
  SiGooglechrome,
  SiSafari,

} from "react-icons/si";
import { FaEdge } from "react-icons/fa";

const platforms = [
  {
    name: "Chrome",
    icon: SiGooglechrome,
  },
  {
    name: "Safari",
    icon: SiSafari,
  },
  {
    name: "Edge",
    icon: FaEdge ,
  },
  {
    name: "Firefox",
    icon: SiFirefoxbrowser,
  },
  {
    name: "Android",
    icon: SiAndroid,
  },
  {
    name: "iPhone & iPad",
    icon: SiApple,
  },
];

export default function PlatformShowcase() {
  return (
    <section className="bg-background pt-28 sm:pt-40 lg:pt-44 ">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Heading */}
        <div className="max-w-[600px] space-y-6 mx-auto text-center">
          <p className="text-sm font-medium uppercase tracking-[0.02em] text-text-secondary">
            Work wherever you are
          </p>

          <h2 className="mt-3 text-4xl font-semibold leading-heading tracking-heading text-text sm:text-5xl">
            Your productivity, wherever you work.
          </h2>
        </div>


        <p className="mt-5 text-center m-auto max-w-[400px] text-body leading-body tracking-body text-text-secondary">
          Your goals, tasks, and progress stay with you across the devices you
          already use.
        </p>


        <div className="mt-14 border-y border-[var(--color-border)]">
          <div className="grid grid-cols-2 sm:grid-cols-3">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;

              return (
                <div
                  key={platform.name}
                  className={`
                    flex h-32 items-center justify-center gap-4
                    text-text-secondary transition-colors
                    
                    border-[var(--color-border)]

                    ${index % 2 !== 0 ? "border-l" : ""}

                    sm:border-l
                    ${index % 3 === 0 ? "sm:border-l-0" : ""}

                    ${
                      index >= 2
                        ? "border-t"
                        : ""
                    }

                    ${
                      index >= 3
                        ? "sm:border-t"
                        : ""
                    }
                  `}
                >
                  <Icon
                    size={28}
                    strokeWidth={.5}
                    className="shrink-0 text-primary/70 border-primary/70"
                  />

                  <span className="text-lg font-medium tracking-heading text-text-secondary sm:text-xl">
                    {platform.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}