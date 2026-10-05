import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Não foi possível entrar",
};

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Não foi possível entrar</h1>
        <p className="max-w-sm text-muted-foreground">
          Algo deu errado durante o login com o Google. Tente novamente em
          alguns instantes.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Tentar novamente</Link>
      </Button>
    </main>
  );
}
