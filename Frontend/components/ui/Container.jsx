/**
 * Shared page-width container. Two sizes cover every page in the app:
 * "default" (max-w-6xl) for marketing/content pages, and "wide"
 * (max-w-[1408px]) for the plugins/console grid layouts.
 */
const WIDTH_CLASSES = {
  default: "max-w-6xl px-5",
  wide: "max-w-[1408px] px-4 sm:px-6 lg:px-8",
  narrow: "max-w-3xl px-5",
};

export default function Container({
  as: Component = "div",
  size = "default",
  className = "",
  children,
  ...props
}) {
  const classes = [
    "mx-auto w-full",
    WIDTH_CLASSES[size] ?? WIDTH_CLASSES.default,
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
