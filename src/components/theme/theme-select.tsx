"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { THEME_OPTIONS } from "./theme-options";

const subscribe = () => () => {};

/** Seletor de tema com três botões; o tema só é lido após a hidratação. */
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Tema" role="group">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border bg-background p-3 text-sm font-medium transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              selected && "border-primary bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
