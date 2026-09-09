/**
 * Shared card surface. Keeps border/radius/background consistent
 * anywhere a "card" appears (feature tiles, plugin cards, panels).
 *
 * padding: "sm" | "md" | "lg" | "none"
 */
const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export default function Card({
  as: Component = "div",
  padding = "md",
  interactive = false,
  className = "",
  children,
  ...props
}) {
  const classes = [
    "rounded-xl border border-edge bg-surface",
    PADDING_CLASSES[padding] ?? PADDING_CLASSES.md,
    interactive
      ? "transition duration-200 hover:-translate-y-0.5 hover:border-azure-500/40 hover:bg-surface2 hover:shadow-glow"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
