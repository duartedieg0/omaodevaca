import { HandCoins } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-heading text-base font-bold tracking-tight",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <HandCoins className="size-4.5" aria-hidden="true" />
      </span>
      <span>O mão de vaca</span>
    </span>
  );
}
