"use client";

import { Check, X } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
  show: boolean;
}

const requirements = [
  {
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    label: "At least one uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "At least one number",
    test: (password: string) => /[0-9]/.test(password),
  },
];

export default function PasswordRequirements({
  password,
  show,
}: PasswordRequirementsProps) {
  if (!show) return null;

  return (
    <div className="mt-3 space-y-2">
      {requirements.map((requirement) => {
        const valid = requirement.test(password);

        return (
          <div
            key={requirement.label}
            className={`flex items-center gap-2 text-[14px] leading-[1.4] transition-colors ${
              valid ? "text-success" : "text-danger"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {valid ? (
                <Check size={15} strokeWidth={2.4} />
              ) : (
                <X size={15} strokeWidth={2.4} />
              )}
            </span>

            <span>{requirement.label}</span>
          </div>
        );
      })}
    </div>
  );
}