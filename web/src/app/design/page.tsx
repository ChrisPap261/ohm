"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusSwitch } from "@/components/ui/status-switch";
import { useState } from "react";

export default function DesignSystemPage() {
  const [on, setOn] = useState(true);

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          OHM design primitives
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Token-driven components for the clone. Not a product screen.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Fields</h2>
        <Field label="Παράδειγμα" htmlFor="demo" hint="Υπόδειξη πεδίου">
          <Input id="demo" placeholder="Κείμενο…" />
        </Field>
        <StatusSwitch label="Παραδόθηκε" checked={on} onChange={setOn} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Colour roles</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["bg", "var(--color-bg)"],
            ["surface", "var(--color-surface)"],
            ["accent", "var(--color-accent)"],
            ["accent-muted", "var(--color-accent-muted)"],
            ["danger", "var(--color-danger)"],
            ["success", "var(--color-success)"],
            ["warning", "var(--color-warning)"],
            ["info", "var(--color-info)"],
          ].map(([name, color]) => (
            <div key={name} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="h-16" style={{ background: color }} />
              <div className="px-2 py-1 text-xs">{name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
