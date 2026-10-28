"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { NoSeasonState } from "@/components/shell/no-season";
import { useToast } from "@/components/ui/toast";
import {
  cratesToKg,
  eurosToCents,
  formatCurrency,
  formatDate,
  oilKgToLiters,
  todayISO,
} from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { MillProcessing } from "@/lib/types";

export default function MillPage() {
  const { data, activeSeason, saveMill, deleteMill } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<MillProcessing | null>(null);
  const [processingDate, setProcessingDate] = useState(todayISO());
  const [crates, setCrates] = useState("");
  const [olivesKg, setOlivesKg] = useState("");
  const [oilKg, setOilKg] = useState("");
  const [expenses, setExpenses] = useState("");
  const [notes, setNotes] = useState("");

  if (!activeSeason) {
    return (
      <>
        <PageHeader title="Ελαιοτριβείο" />
        <NoSeasonState />
      </>
    );
  }

  const rows = data.mill.filter((m) => m.seasonId === activeSeason.id);

  function openCreate() {
    setEdit(null);
    setProcessingDate(todayISO());
    setCrates("");
    setOlivesKg("");
    setOilKg("");
    setExpenses("");
    setNotes("");
    setOpen(true);
  }

  function openEdit(m: MillProcessing) {
    setEdit(m);
    setProcessingDate(m.processingDate);
    setCrates(m.crates != null ? String(m.crates) : "");
    setOlivesKg(String(m.olivesKg));
    setOilKg(String(m.oilKg));
    setExpenses(String(m.expenses / 100));
    setNotes(m.notes);
    setOpen(true);
  }

  function onCrates(v: string) {
    setCrates(v);
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0) setOlivesKg(String(cratesToKg(n)));
  }

  function save() {
    saveMill({
      id: edit?.id,
      seasonId: activeSeason!.id,
      processingDate,
      crates: crates === "" ? null : Number(crates),
      olivesKg: Number(olivesKg),
      oilKg: Number(oilKg),
      expenses: eurosToCents(Number(expenses)),
      notes,
    });
    toast(edit ? "Ενημερώθηκε." : "Καταχωρήθηκε επεξεργασία.", "success");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Ελαιοτριβείο"
        description={`Περίοδος ${activeSeason.name}`}
        actions={<Button onClick={openCreate}>Νέα επεξεργασία</Button>}
      />

      {rows.length === 0 ? (
        <EmptyState
          message="Καμία καταχώρηση ελαιοτριβείου ακόμα."
          action={<Button onClick={openCreate}>Πρώτη καταχώρηση</Button>}
        />
      ) : (
        <Panel>
          <DataTable
            headers={["Ημερομηνία", "Τελάρα", "Ελιές", "Λάδι", "Κόστος", "Απόδοση", "Ενέργειες"]}
          >
            {rows.map((m) => {
              const ratio = m.oilKg > 0 ? (m.olivesKg / m.oilKg).toFixed(1) : "0";
              return (
                <tr key={m.id} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">{formatDate(m.processingDate)}</td>
                  <td className="px-4 py-3">{m.crates ?? "—"}</td>
                  <td className="px-4 py-3">{m.olivesKg} kg</td>
                  <td className="px-4 py-3">
                    <strong>{m.oilKg} kg</strong> ({oilKgToLiters(m.oilKg)} L)
                  </td>
                  <td className="px-4 py-3">{formatCurrency(m.expenses)}</td>
                  <td className="px-4 py-3">{ratio}:1</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                        Επεξεργασία
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Διαγραφή;")) {
                            deleteMill(m.id);
                            toast("Διαγράφηκε.", "success");
                          }
                        }}
                      >
                        Διαγραφή
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
          <MobileCards>
            {rows.map((m) => (
              <MobileCard
                key={m.id}
                header={formatDate(m.processingDate)}
                rows={[
                  { label: "Τελάρα", value: m.crates ?? "—" },
                  { label: "Ελιές", value: `${m.olivesKg} kg` },
                  { label: "Λάδι", value: `${m.oilKg} kg (${oilKgToLiters(m.oilKg)} L)` },
                  { label: "Κόστος", value: formatCurrency(m.expenses) },
                  {
                    label: "Απόδοση",
                    value: `${m.oilKg > 0 ? (m.olivesKg / m.oilKg).toFixed(1) : "0"}:1`,
                  },
                ]}
                actions={
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteMill(m.id);
                          toast("Διαγράφηκε.", "success");
                        }
                      }}
                    >
                      Διαγραφή
                    </Button>
                  </>
                }
              />
            ))}
          </MobileCards>
        </Panel>
      )}

      <Modal
        open={open}
        title={edit ? "Επεξεργασία" : "Νέα επεξεργασία"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Ακύρωση
            </Button>
            <Button onClick={save}>Αποθήκευση</Button>
          </>
        }
      >
        <Field label="Ημερομηνία" htmlFor="m-date">
          <Input id="m-date" type="date" value={processingDate} onChange={(e) => setProcessingDate(e.target.value)} required />
        </Field>
        <Field label="Τελάρα" htmlFor="m-crates" hint="Προαιρετικό · συμπληρώνει κιλά ελιών (× 22,5)">
          <Input id="m-crates" type="number" min={0} value={crates} onChange={(e) => onCrates(e.target.value)} />
        </Field>
        <Field label="Κιλά ελιών" htmlFor="m-olives">
          <Input id="m-olives" type="number" min={0} value={olivesKg} onChange={(e) => setOlivesKg(e.target.value)} required />
        </Field>
        <Field label="Κιλά λαδιού" htmlFor="m-oil" hint="Λίτρα ≈ κιλά × 1,1">
          <Input id="m-oil" type="number" min={0} value={oilKg} onChange={(e) => setOilKg(e.target.value)} required />
        </Field>
        <Field label="Κόστος (€)" htmlFor="m-exp">
          <Input id="m-exp" type="number" min={0} step="0.01" value={expenses} onChange={(e) => setExpenses(e.target.value)} required />
        </Field>
        <Field label="Σημειώσεις" htmlFor="m-notes">
          <Textarea id="m-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
