import type { Metadata } from "next";

import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeSelect } from "@/components/theme/theme-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e suas preferências.</p>
      </div>

      <ProfileForm
        profile={{
          name: profile.name ?? "",
          email: profile.email,
          avatarUrl: profile.avatar_url,
          currency: profile.currency,
          locale: profile.locale,
          timezone: profile.timezone,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Escolha como o O mão de vaca aparece para você.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelect />
        </CardContent>
      </Card>
    </div>
  );
}
