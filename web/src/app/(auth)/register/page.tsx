"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const { ready, profile, register } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && profile) router.replace("/dashboard");
  }, [ready, profile, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast("Οι κωδικοί δεν ταιριάζουν.", "danger");
      return;
    }
    setLoading(true);
    const result = register({ fullName, username, email, password });
    setLoading(false);
    if (!result.ok) {
      toast(result.error, "danger");
      return;
    }
    toast("Ο λογαριασμός δημιουργήθηκε.", "success");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-accent-muted),_var(--color-bg)_55%)] p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-pop)]">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Νέος λογαριασμός
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Ξεκίνα την καταγραφή της περιόδου
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" autoComplete="off">
          <Field label="Ονοματεπώνυμο" htmlFor="reg-name">
            <Input id="reg-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Όνομα χρήστη" htmlFor="reg-user">
            <Input id="reg-user" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </Field>
          <Field label="Email" htmlFor="reg-email">
            <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Κωδικός" htmlFor="reg-pass">
            <Input
              id="reg-pass"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Επιβεβαίωση κωδικού" htmlFor="reg-pass2">
            <Input
              id="reg-pass2"
              type="password"
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Εγγραφή
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Έχεις ήδη λογαριασμό;{" "}
          <Link href="/login" className="font-medium text-[var(--color-accent)]">
            Είσοδος
          </Link>
        </p>
      </div>
    </div>
  );
}
