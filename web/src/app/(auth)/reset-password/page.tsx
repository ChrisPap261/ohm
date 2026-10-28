"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const toast = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast("Απαιτείται Supabase.", "warning");
      return;
    }
    if (password.length < 6) {
      toast("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.", "danger");
      return;
    }
    if (password !== confirm) {
      toast("Οι κωδικοί δεν ταιριάζουν.", "danger");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast(error.message || "Αποτυχία ενημέρωσης κωδικού.", "danger");
      return;
    }
    toast("Ο κωδικός ενημερώθηκε.", "success");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-accent-muted),_var(--color-bg)_55%)] p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-pop)]">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Νέος κωδικός
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Όρισε νέο κωδικό για τον λογαριασμό σου
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" autoComplete="off">
          <Field label="Νέος κωδικός" htmlFor="new-pass">
            <Input
              id="new-pass"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Επιβεβαίωση" htmlFor="new-pass2">
            <Input
              id="new-pass2"
              type="password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Αποθήκευση
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/login" className="font-medium text-[var(--color-accent)]">
            Επιστροφή στη σύνδεση
          </Link>
        </p>
      </div>
    </div>
  );
}
