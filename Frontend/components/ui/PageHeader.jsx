/**
 * Shared page header: mono "kicker" label + heading + optional
 * description. Every top-level route should have exactly one <h1>,
 * so this defaults to "h1" — pass level="h2" when the header sits
 * inside a page that already has its own h1 (e.g. a section header).
 *
 * align: "center" | "left"
 */
export default function PageHeader({
  kicker,
  title,
  description,
  level = "h1",
  align = "center",
  icon: Icon,
  className = "",
  titleClassName = "",
}) {
  const HeadingTag = level;
  const isH1 = level === "h1";

  return (
    <div
      className={[
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {kicker ? (
        <p
          className={[
            "mb-3 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-azure-500",
            align === "center" ? "justify-center" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {Icon ? <Icon size={13} aria-hidden="true" /> : null}
          {kicker}
        </p>
      ) : null}
      <HeadingTag
        className={[
          "font-display font-bold tracking-tight text-fg",
          isH1 ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
          titleClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title}
      </HeadingTag>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
