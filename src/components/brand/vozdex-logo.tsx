import Image from "next/image";
import { cn } from "@/lib/utils";

export function VozdexLogo({
  className,
  title = "Vozdex AI",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span className={cn("relative block overflow-hidden", className)} role="img" aria-label={title}>
      <Image
        src="/vozdex-logo.svg.jpeg"
        alt={title}
        fill
        sizes="(max-width: 1024px) 24px, 40px"
        className="object-contain"
      />
    </span>
  );
}
