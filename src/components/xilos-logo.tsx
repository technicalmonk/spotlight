import { cn } from "@/lib/utils";

export function XilosLogo({
  className,
  variant = "blue",
  showText = true,
  size = "md",
}: {
  className?: string;
  variant?: "blue" | "white" | "black";
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-5",
    md: "h-7",
    lg: "h-9",
  };

  const logoFile = {
    blue: "/xilos-logo-blue.svg",
    white: "/xilos-logo-white.svg",
    black: "/xilos-logo-black.svg",
  }[variant];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoFile}
        alt="Xilos"
        className={cn(sizes[size], "w-auto")}
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          <span className={variant === "white" ? "text-white/60" : "text-gray-400"}>Xilos</span>{" "}
          <span className={variant === "white" ? "text-white" : "text-ink-900"}>Spotlight</span>
        </span>
      )}
    </div>
  );
}
