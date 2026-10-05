"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { isNavItemActive, NAV_ITEMS } from "./nav-items";

export function AppHeader() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Abrir ou fechar menu" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <span className="text-sm font-medium">{current?.title}</span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
