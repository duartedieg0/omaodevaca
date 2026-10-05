import { ArrowLeftRight, Landmark, Target, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/dashboard/coming-soon-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { getCurrentProfile } from "@/data/profile";
import { requireUserId } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

const COMING_SOON = [
  {
    title: "Contas",
    description: "Cadastre contas e carteiras para saber quanto você tem em cada lugar.",
    icon: Landmark,
  },
  {
    title: "Transações",
    description: "Registre entradas e saídas e veja para onde o dinheiro está indo.",
    icon: ArrowLeftRight,
  },
  {
    title: "Orçamentos",
    description: "Defina limites por categoria e evite sustos no fim do mês.",
    icon: Target,
  },
  {
    title: "Investimentos",
    description: "Acompanhe seus investimentos e quanto eles estão rendendo.",
    icon: TrendingUp,
  },
];

export default async function DashboardPage() {
  // Layout e página renderizam em paralelo: a página não pode depender do guard do layout.
  await requireUserId();
  const profile = await getCurrentProfile();
  const firstName = profile?.name?.trim().split(/\s+/)[0] || null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WelcomeCard firstName={firstName} />
      <section aria-labelledby="em-breve" className="space-y-4">
        <h2 id="em-breve" className="font-heading text-lg font-semibold">
          O que vem por aí
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMING_SOON.map((item) => (
            <ComingSoonCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
