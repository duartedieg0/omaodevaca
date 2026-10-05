import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
