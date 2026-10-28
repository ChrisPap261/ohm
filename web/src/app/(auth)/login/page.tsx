"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const { ready, profile, login } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && profile) router.replace("/dashboard");
  }, [ready, profile, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = login({ usernameOrEmail, password });
    setLoading(false);
    if (!result.ok) {
      toast(result.error, "danger");
      return;
    }
    toast("Καλωσήρθες!", "success");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-accent-muted),_var(--color-bg)_55%)] p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-pop)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent)] font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-on-accent)]">
            Ω
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">OHM</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Σύνδεση στον λογαριασμό συγκομιδής
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" autoComplete="off">
          <Field label="Όνομα χρήστη ή email" htmlFor="login-user">
            <Input
              id="login-user"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Κωδικός" htmlFor="login-pass">
            <Input
              id="login-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Είσοδος
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Δεν έχεις λογαριασμό;{" "}
          <Link href="/register" className="font-medium text-[var(--color-accent)]">
            Δημιουργία
          </Link>
        </p>
      </div>
    </div>
  );
}
