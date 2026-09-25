import {
  BarChart3,
  CalendarClock,
  ListTodo,
  Smartphone,
  Target,
  Timer,
} from "lucide-react";

const features = [
  {
    title: "Set goals that actually stick",
    description:
      "Turn the things you want to accomplish into clear, trackable goals and keep your bigger picture in sight.",
    icon: Target,
  },
  {
    title: "Focus with a timer",
    description:
      "Give your attention one task at a time and make focused work easier with a simple built-in timer.",
    icon: Timer,
  },
  {
    title: "Work from anywhere",
    description:
      "Utimely is web-based, so your tasks, goals, and progress stay accessible from anywhere.",
    icon: Smartphone,
  },
  {
    title: "Create and track tasks",
    description:
      "Break your goals into manageable tasks, mark them complete, and see what you've finished today.",
    icon: ListTodo,
  },
  {
    title: "Understand your progress",
    description:
      "Get a clear view of the time you've worked, tasks you've completed, and analyze your progress.",
    icon: BarChart3,
  },
  {
    title: "Schedule what's next",
    description:
      "Plan tasks ahead of time so you know what's coming and can focus on what matters today.",
    icon: CalendarClock,
  },
];

function FeatureCard({
  feature,
  className = "",
}: {
  feature: (typeof features)[number];
  className?: string;
}) {
  const Icon = feature.icon;

  return (
    <div
      className={`flex flex-col justify-between bg-surface p-7 ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
        <Icon size={20} strokeWidth={1.8} />
      </div>

      <div>
        <h3 className="max-w-[520px] text-2xl font-semibold leading-heading tracking-heading text-text">
          {feature.title}
        </h3>

        <p className="mt-4 max-w-[520px] text-body leading-body tracking-body text-text-secondary">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export default function HeroFeatures() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden h-[720px] gap-1 lg:grid lg:grid-cols-12">
        {/* Left - 50% */}
        <div className="col-span-6 flex min-h-0 flex-col gap-1">
          <FeatureCard
            feature={features[0]}
            className="min-h-0 flex-[1.05]"
          />

          <FeatureCard
            feature={features[5]}
            className="min-h-0 flex-[0.95]"
          />
        </div>

        {/* Middle - 25% */}
        <div className="col-span-3 flex min-h-0 flex-col gap-1">
          <FeatureCard
            feature={features[1]}
            className="min-h-0 flex-[0.9]"
          />

          <FeatureCard
            feature={features[3]}
            className="min-h-0 flex-[1.1]"
          />
        </div>

        {/* Right - 25% */}
        <div className="col-span-3 flex min-h-0 flex-col gap-1">
          <FeatureCard
            feature={features[2]}
            className="min-h-0 flex-[1]"
          />

          <FeatureCard
            feature={features[4]}
            className="min-h-0 flex-[1]"
          />
        </div>
      </div>

      {/* Tablet */}
      <div className="hidden grid-cols-2 gap-1 sm:grid lg:hidden">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            className="min-h-[320px]"
          />
        ))}
      </div>

      {/* Mobile */}
      <div className="grid grid-cols-1 gap-1 sm:hidden">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            className="min-h-[300px]"
          />
        ))}
      </div>
    </>
  );
}