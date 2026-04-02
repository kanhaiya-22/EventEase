import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: 28,
  md: 36,
  lg: 48,
};

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.svg"
        alt="EventEase"
        width={sizes[size]}
        height={sizes[size]}
        priority
      />
      {showText && (
        <span
          className={cn("font-bold tracking-tight", {
            "text-lg": size === "sm",
            "text-xl": size === "md",
            "text-2xl": size === "lg",
          })}
        >
          Event<span className="text-primary">Ease</span>
        </span>
      )}
    </Link>
  );
}
