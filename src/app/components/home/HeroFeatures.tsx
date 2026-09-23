import { BarChart3, Target, Timer } from "lucide-react";

const features = [
  {
    title: "Set goals that actually stick",
    description:
      "Turn the things you want to accomplish into clear, trackable goals.",
    icon: Target,
    className: "lg:col-span-2",
  },
  {
    title: "Focus with a timer",
    description:
      "Give your attention one job at a time and make focused work easier.",
    icon: Timer,
    className: "lg:col-span-1",
  },
  {
    title: "Understand your progress",
    description:
      "See where your time goes and how consistently you're moving forward.",
    icon: BarChart3,
    className: "lg:col-span-1",
  },
];

export default function HeroFeatures() {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <div
            key={feature.title}
            className={`min-h-[260px] bg-surface p-7 sm:min-h-[280px] ${feature.className}`}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary">
                <Icon size={20} strokeWidth={1.8} />
              </div>

              <div>
                <h3 className="text-2xl font-semibold leading-heading tracking-heading text-text">
                  {feature.title}
                </h3>

                <p className="mt-4 max-w-[500px] text-body leading-body tracking-body text-text-secondary">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}