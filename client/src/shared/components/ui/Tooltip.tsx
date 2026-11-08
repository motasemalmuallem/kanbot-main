import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
  placement?: "top" | "bottom";
  align?: "start" | "center" | "end";
  className?: string;
};

/** Small hover hint for controls whose purpose is not obvious from their icon. */
export function Tooltip({
  content,
  children,
  placement = "top",
  align = "center",
  className = "",
}: TooltipProps) {
  const tooltipId = useId();
  let child = children;
  if (isValidElement(children)) {
    const element = children as ReactElement<{ "aria-describedby"?: string; title?: string }>;
    child = cloneElement(element, {
      "aria-describedby": [element.props["aria-describedby"], tooltipId]
        .filter(Boolean)
        .join(" "),
      title: undefined,
    });
  }

  return (
    <span className={`group/tooltip relative inline-flex ${className}`.trim()}>
      {child}
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute z-[120] ${placement === "bottom" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]"} ${align === "start" ? "start-0" : align === "end" ? "end-0" : "right-1/2 translate-x-1/2"} translate-y-1 w-max max-w-[min(220px,calc(100vw-24px))] rounded-md border border-kanbot-line-strong bg-kanbot-zinc-900 px-2 py-1.5 text-[11px] font-medium leading-snug text-kanbot-zinc-100 opacity-0 shadow-xl transition duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100`}
      >
        {content}
      </span>
    </span>
  );
}
