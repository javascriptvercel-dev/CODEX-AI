"use client";
import Link from "next/link";

/**
 * Shared button primitive.
 *
 * Centralizes height and colour so buttons stop drifting across pages.
 * Renders a <button>, or a Next.js <Link> when `href` is provided.
 *
 * variant: "primary" | "secondary" | "ghost" | "danger"
 * size:    "sm" | "md" | "lg"
 */
const VARIANT_CLASSES = {
  primary:
    "border border-azure-500 bg-azure-500 text-white hover:bg-azure-600 hover:border-azure-600",
  secondary:
    "border border-edge bg-surface2 text-fg hover:border-azure-500/60",
  ghost:
    "border border-transparent bg-transparent text-muted hover:text-fg hover:bg-surface2",
  danger:
    "border border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600",
};

const SIZE_CLASSES = {
  sm: "h-9 gap-1.5 rounded-md px-3 text-xs",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-sm",
};

export default function Button({
  as,
  href,
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  children,
  ...props
}) {
  const classes = [
    "focus-ring inline-flex flex-shrink-0 items-center justify-center whitespace-nowrap font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    SIZE_CLASSES[size] || SIZE_CLASSES.md,
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    full ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = as === "span" ? "span" : undefined;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (Component) {
    return (
      <Component className={classes} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <button type={props.type || "button"} className={classes} {...props}>
      {children}
    </button>
  );
}
