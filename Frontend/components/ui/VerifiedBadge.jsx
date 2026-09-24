import { BadgeCheck } from "lucide-react";

/**
 * Small inline badge marking an admin identity. Drop it next to any
 * name/author label — plugin cards, submission cards, the console
 * greeting, the navbar avatar — wherever an admin's name is shown.
 */
export default function VerifiedBadge({
  size = 14,
  className = "",
  label = "Verified admin",
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex flex-shrink-0 items-center text-azure-500 ${className}`}
    >
      <BadgeCheck size={size} strokeWidth={2.4} aria-hidden="true" />
    </span>
  );
}
