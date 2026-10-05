import { LayoutDashboard, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", title: "Dashboard", icon: LayoutDashboard },
  { href: "/app/configuracoes", title: "Configurações", icon: Settings },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
