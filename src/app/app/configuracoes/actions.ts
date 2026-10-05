"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateCurrentProfile } from "@/data/profile";
import { requireUserId } from "@/lib/auth/session";
import {
  profileUpdateSchema,
  type ProfileUpdate,
} from "@/lib/validations/profile";

export type ProfileFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof ProfileUpdate, string[]>>;
  /** Valores enviados, devolvidos em caso de erro para não perder a digitação. */
  values?: { name: string };
};

export async function updateProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  await requireUserId();

  const submittedName = formData.get("name");
  const values = {
    name: typeof submittedName === "string" ? submittedName : "",
  };

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    locale: formData.get("locale"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const saved = await updateCurrentProfile(parsed.data);

  if (!saved) {
    return {
      ok: false,
      message: "Não foi possível salvar suas alterações. Tente novamente.",
      values,
    };
  }

  revalidatePath("/app", "layout");
  return { ok: true, message: "Alterações salvas." };
}
