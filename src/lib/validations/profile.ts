import { z } from "zod";

import { CURRENCIES, LOCALES, TIMEZONES } from "@/lib/preferences";

export const profileUpdateSchema = z.object({
  name: z
    .string({ error: "Informe seu nome." })
    .trim()
    .min(1, { error: "Informe seu nome." })
    .max(100, { error: "Use no máximo 100 caracteres." }),
  currency: z.enum(CURRENCIES, { error: "Escolha uma moeda válida." }),
  locale: z.enum(LOCALES, { error: "Escolha um idioma válido." }),
  timezone: z.enum(TIMEZONES, { error: "Escolha um fuso horário válido." }),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
