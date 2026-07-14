"use client";

import { cn } from "@/lib/utils";

const TOKEN_COLORS: Record<string, { bg: string; text: string }> = {
  SOL: { bg: "bg-gradient-to-br from-[#9945FF] to-[#14F195]", text: "text-white" },
  USDC: { bg: "bg-gradient-to-br from-[#2775CA] to-[#1A5DAB]", text: "text-white" },
  JUP: { bg: "bg-gradient-to-br from-[#13b8a4] to-[#0e8c7e]", text: "text-white" },
  BONK: { bg: "bg-gradient-to-br from-[#F5A623] to-[#E8961B]", text: "text-white" },
  PYTH: { bg: "bg-gradient-to-br from-[#6B3FA0] to-[#4A2D7A]", text: "text-white" },
  JTO: { bg: "bg-gradient-to-br from-[#2ECC71] to-[#1FAF5E]", text: "text-white" },
  WIF: { bg: "bg-gradient-to-br from-[#D35400] to-[#B34700]", text: "text-white" },
};

const DEFAULT_COLOR = { bg: "bg-gradient-to-br from-zinc-500 to-zinc-700", text: "text-white" };

export function TokenIcon({
  symbol,
  logoUri,
  size = "md",
  className,
}: {
  symbol?: string;
  logoUri?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const colors = TOKEN_COLORS[symbol ?? ""] ?? DEFAULT_COLOR;

  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  if (logoUri) {
    return (
      <img
        src={logoUri}
        alt={symbol ?? "Token"}
        className={cn("shrink-0 rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold shadow-md",
        colors.bg,
        colors.text,
        sizeClasses[size],
        className,
      )}
    >
      {symbol ? symbol.charAt(0) : "?"}
    </div>
  );
}
