import "server-only";

import { cache } from "react";

import { getCurrentUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProfileUpdate } from "@/lib/validations/profile";

export type Profile = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  currency: string;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

const PROFILE_COLUMNS =
  "id, name, email, avatar_url, currency, locale, timezone, created_at, updated_at";

/** Profile do usuário autenticado (deduplicado por requisição). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) {
    throw new Error("Não foi possível carregar o perfil.");
  }

  return data;
});

/** Atualiza somente os campos editáveis do profile do usuário autenticado. */
export async function updateCurrentProfile(
  input: ProfileUpdate,
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name,
      currency: input.currency,
      locale: input.locale,
      timezone: input.timezone,
    })
    .eq("id", userId);

  return !error;
}
