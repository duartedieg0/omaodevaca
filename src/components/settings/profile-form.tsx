"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  updateProfileAction,
  type ProfileFormState,
} from "@/app/app/configuracoes/actions";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  LOCALES,
  LOCALE_LABELS,
  TIMEZONES,
  TIMEZONE_LABELS,
} from "@/lib/preferences";

export type ProfileFormValues = {
  name: string;
  email: string;
  avatarUrl: string | null;
  currency: string;
  locale: string;
  timezone: string;
};

const initialState: ProfileFormState = { ok: false };

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-destructive">
      {messages[0]}
    </p>
  );
}

type PreferenceSelectProps = {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  options: readonly string[];
  labels: Record<string, string>;
  errors?: string[];
};

function PreferenceSelect({
  id,
  name,
  label,
  defaultValue,
  options,
  labels,
  errors,
}: PreferenceSelectProps) {
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? errorId : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const nameErrors = state.fieldErrors?.name;
  // Após a action o React restaura os campos para o defaultValue; em caso de
  // erro usamos o valor enviado para não apagar o que o usuário digitou.
  const nameValue = state.values?.name ?? profile.name;

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Como você aparece no O mão de vaca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={profile.name || profile.email}
              avatarUrl={profile.avatarUrl}
              className="size-16 text-lg"
            />
            <p className="text-sm text-muted-foreground">
              A foto vem da sua conta Google.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={nameValue}
              maxLength={100}
              autoComplete="name"
              required
              aria-invalid={nameErrors?.length ? true : undefined}
              aria-describedby={nameErrors?.length ? "name-error" : undefined}
            />
            <FieldError id="name-error" messages={nameErrors} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              readOnly
              aria-describedby="email-hint"
              className="bg-muted text-muted-foreground"
            />
            <p id="email-hint" className="text-sm text-muted-foreground">
              Vem da sua conta Google e não pode ser alterado aqui.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>
            Usadas para formatar valores e datas. Mais opções em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <PreferenceSelect
            id="currency"
            name="currency"
            label="Moeda"
            defaultValue={profile.currency}
            options={CURRENCIES}
            labels={CURRENCY_LABELS}
            errors={state.fieldErrors?.currency}
          />
          <PreferenceSelect
            id="locale"
            name="locale"
            label="Idioma e região"
            defaultValue={profile.locale}
            options={LOCALES}
            labels={LOCALE_LABELS}
            errors={state.fieldErrors?.locale}
          />
          <PreferenceSelect
            id="timezone"
            name="timezone"
            label="Fuso horário"
            defaultValue={profile.timezone}
            options={TIMEZONES}
            labels={TIMEZONE_LABELS}
            errors={state.fieldErrors?.timezone}
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
