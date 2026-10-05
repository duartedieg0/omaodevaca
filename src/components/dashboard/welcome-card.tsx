import { CowPattern } from "@/components/brand/cow-pattern";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function WelcomeCard({ firstName }: { firstName: string | null }) {
  return (
    <Card className="relative overflow-hidden">
      <CowPattern className="opacity-[0.04] dark:opacity-[0.06]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <CardHeader className="relative">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Olá{firstName ? `, ${firstName}` : ""} <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-lg font-medium">Bem-vindo ao O mão de vaca.</p>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <p className="max-w-2xl text-muted-foreground">
          Aqui você vai acompanhar suas finanças, entender para onde seu dinheiro
          está indo e descobrir onde dá para economizar.
        </p>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="font-medium">Estamos começando sua vida financeira por aqui.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Na próxima etapa você poderá cadastrar suas contas e começar a
            organizar suas movimentações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
