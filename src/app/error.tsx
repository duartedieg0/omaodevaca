"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Algo deu errado</h1>
        <p className="max-w-sm text-muted-foreground">
          Não conseguimos carregar esta página. Tente novamente; se o problema
          continuar, saia e entre de novo.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => retry()}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link href="/">Ir para o início</Link>
        </Button>
        <SignOutButton />
      </div>
    </main>
  );
}
