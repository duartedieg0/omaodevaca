// Opções de preferência aceitas pela aplicação. Para liberar novas opções,
// basta acrescentá-las aqui: o banco valida apenas o formato dos valores.

export const CURRENCIES = ["BRL"] as const;
export const LOCALES = ["pt-BR"] as const;
export const TIMEZONES = ["America/Sao_Paulo"] as const;

export type Currency = (typeof CURRENCIES)[number];
export type Locale = (typeof LOCALES)[number];
export type Timezone = (typeof TIMEZONES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  BRL: "Real brasileiro (R$)",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
};

export const TIMEZONE_LABELS: Record<Timezone, string> = {
  "America/Sao_Paulo": "Horário de Brasília (GMT-3)",
};
