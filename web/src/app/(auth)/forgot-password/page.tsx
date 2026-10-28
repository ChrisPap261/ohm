"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast(
        "Η επαναφορά κωδικού είναι διαθέσιμη μόνο με ρυθμισμένο Supabase.",
        "warning",
      );
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: origin ? `${origin}/reset-password` : undefined,
    });
    setLoading(false);
    if (error) {
      toast(error.message || "Αποτυχία αποστολής.", "danger");
      return;
    }
    setSent(true);
    toast("Αν υπάρχει λογαριασμός, στάλθηκε email επαναφοράς.", "success");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-accent-muted),_var(--color-bg)_55%)] p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-pop)]">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Επαναφορά κωδικού
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Θα σου στείλουμε σύνδεσμο στο email σου
          </p>
        </div>

        {sent ? (
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Έλεγξε τα εισερχόμενά σου και ακολούθησε τον σύνδεσμο.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" autoComplete="off">
            <Field label="Email" htmlFor="reset-email">
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              Αποστολή συνδέσμου
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/login" className="font-medium text-[var(--color-accent)]">
            Επιστροφή στη σύνδεση
          </Link>
        </p>
      </div>
    </div>
  );
}
