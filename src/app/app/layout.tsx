import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentProfile } from "@/data/profile";
import { requireUserId } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  await requireUserId();
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado.");
  }

  const user = {
    name: profile.name || profile.email,
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
