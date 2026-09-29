import type { SVGProps } from "react";

import { cn } from "@/lib/cn";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function iconProps(
  { className, size = 16, ...props }: IconProps,
  defaultClassName?: string,
) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: cn("shrink-0", defaultClassName, className),
    ...props,
  };
}

/** Simple geometric icons - one coherent stroke style. */

export function IconGithub(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M9 19c-4.3 1.4-4.3-2.1-6-2.5M15 22v-3.9a3.4 3.4 0 0 0-1-2.6c3.2-.3 6.6-1.6 6.6-7.1A5.5 5.5 0 0 0 19 4.3 5.1 5.1 0 0 0 18.9 1S17.7.7 15 2.6a12 12 0 0 0-6 0C6.3.7 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.3a5.5 5.5 0 0 0-1.5 3.8c0 5.5 3.4 6.7 6.6 7.1a3.4 3.4 0 0 0-1 2.6V22" />
    </svg>
  );
}

export function IconExternalLink(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function IconLoader(props: IconProps) {
  return (
    <svg {...iconProps(props, "animate-spin")}>
      <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}
