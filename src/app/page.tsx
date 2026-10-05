import { redirect } from "next/navigation";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { CowPattern } from "@/components/brand/cow-pattern";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { getCurrentUserId } from "@/lib/auth/session";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { next } = await searchParams;
  const nextPath = safeRedirectPath(typeof next === "string" ? next : null);

  if (await getCurrentUserId()) {
    redirect(nextPath);
  }

  return (
    <div className="bg-hero relative isolate flex min-h-dvh flex-col overflow-hidden">
      <CowPattern className="-z-10 opacity-[0.035] dark:opacity-[0.05]" />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <span className="mb-6 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          Finanças pessoais, sem drama
        </span>
        <h1 className="font-heading text-5xl font-extrabold tracking-tight text-balance sm:text-7xl">
          O mão de vaca
        </h1>
        <p className="mt-5 text-xl font-medium text-balance sm:text-2xl">
          Seu dinheiro merece mais controle e{" "}
          <span className="text-primary">menos sustos.</span>
        </p>
        <p className="mt-3 max-w-md text-pretty text-muted-foreground">
          Organize sua vida financeira de forma simples, visual e sem complicação.
        </p>
        <div className="mt-10">
          <GoogleLoginButton next={nextPath} />
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        Feito para quem conta cada centavo.
      </footer>
    </div>
  );
}
