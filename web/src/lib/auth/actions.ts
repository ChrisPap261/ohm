"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Απαιτείται όνομα χρήστη ή email.");

export async function resolveLoginEmail(
  usernameOrEmail: string,
): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const parsed = loginIdentifierSchema.safeParse(usernameOrEmail);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Άκυρα στοιχεία." };
  }

  const value = parsed.data;
  if (value.includes("@")) {
    return { ok: true, email: value };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Το Supabase δεν είναι ρυθμισμένο." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("email_for_username", {
    p_username: value,
  });

  if (error || !data || typeof data !== "string") {
    return { ok: false, error: "Λάθος στοιχεία σύνδεσης." };
  }

  return { ok: true, email: data };
}
