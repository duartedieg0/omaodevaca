import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ComingSoonCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ComingSoonCard({ title, description, icon: Icon }: ComingSoonCardProps) {
  return (
    <Card aria-disabled="true" className="border-dashed bg-muted/40 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <span className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {title}
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">Em breve</Badge>
        </CardAction>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
