import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgLogoProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "md" | "lg" | "full";
}

const SIZE_CLASSES: Record<NonNullable<OrgLogoProps["size"]>, string> = {
  xs: "h-5 w-5",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const ICON_CLASSES: Record<NonNullable<OrgLogoProps["size"]>, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
};

const ROUNDED_CLASSES: Record<NonNullable<OrgLogoProps["rounded"]>, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function OrgLogo({
  src,
  name,
  size = "md",
  className,
  rounded = "lg",
}: OrgLogoProps) {
  const wrapperClass = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden border bg-primary/10 text-primary",
    SIZE_CLASSES[size],
    ROUNDED_CLASSES[rounded],
    className
  );

  if (src) {
    return (
      <span className={wrapperClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ? `${name} logo` : "Organization logo"}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className={wrapperClass}>
      <Building2 className={ICON_CLASSES[size]} />
    </span>
  );
}
