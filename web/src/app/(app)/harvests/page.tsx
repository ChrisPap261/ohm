"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { NoSeasonState } from "@/components/shell/no-season";
import { useToast } from "@/components/ui/toast";
import { cratesToKg, formatDate, todayISO } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Harvest } from "@/lib/types";

export default function HarvestsPage() {
  const { data, activeSeason, saveHarvest, deleteHarvest } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Harvest | null>(null);
  const [fieldId, setFieldId] = useState("");
  const [harvestDate, setHarvestDate] = useState(todayISO());
  const [crates, setCrates] = useState("");
  const [olivesKg, setOlivesKg] = useState("");
  const [notes, setNotes] = useState("");

  if (!activeSeason) {
    return (
      <>
        <PageHeader title="Συγκομιδές" />
        <NoSeasonState />
      </>
    );
  }

  const rows = data.harvests.filter((h) => h.seasonId === activeSeason.id);

  function openCreate() {
    setEdit(null);
    setFieldId(data.fields[0]?.id ?? "");
    setHarvestDate(todayISO());
    setCrates("");
    setOlivesKg("");
    setNotes("");
    setOpen(true);
  }

  function openEdit(h: Harvest) {
    setEdit(h);
    setFieldId(h.fieldId);
    setHarvestDate(h.harvestDate);
    setCrates(String(h.crates));
    setOlivesKg(String(h.olivesKg));
    setNotes(h.notes);
    setOpen(true);
  }

  function onCrates(v: string) {
    setCrates(v);
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0) setOlivesKg(String(cratesToKg(n)));
  }

  function save() {
    if (!fieldId) {
      toast("Επίλεξε αγροτεμάχιο.", "danger");
      return;
    }
    saveHarvest({
      id: edit?.id,
      fieldId,
      seasonId: activeSeason!.id,
      harvestDate,
      crates: Number(crates),
      olivesKg: Number(olivesKg),
      notes,
    });
    toast(edit ? "Ενημερώθηκε." : "Καταχωρήθηκε συγκομιδή.", "success");
    setOpen(false);
  }

  function fieldName(id: string) {
    return data.fields.find((f) => f.id === id)?.name ?? "—";
  }

  return (
    <>
      <PageHeader
        title="Συγκομιδές"
        description={`Περίοδος ${activeSeason.name}`}
        actions={<Button onClick={openCreate}>Νέα συγκομιδή</Button>}
      />

      {data.fields.length === 0 ? (
        <EmptyState message="Πρόσθεσε πρώτα αγροτεμάχιο για να καταχωρήσεις συγκομιδή." />
      ) : rows.length === 0 ? (
        <EmptyState
          message="Δεν υπάρχουν συγκομιδές σε αυτή την περίοδο."
          action={<Button onClick={openCreate}>Πρώτη καταχώρηση</Button>}
        />
      ) : (
        <Panel>
          <DataTable headers={["Ημερομηνία", "Αγροτεμάχιο", "Τελάρα", "Κιλά", "Σημειώσεις", "Ενέργειες"]}>
            {rows.map((h) => (
              <tr key={h.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">{formatDate(h.harvestDate)}</td>
                <td className="px-4 py-3">{fieldName(h.fieldId)}</td>
                <td className="px-4 py-3">{h.crates}</td>
                <td className="px-4 py-3">{h.olivesKg} kg</td>
                <td className="px-4 py-3">{h.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(h)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteHarvest(h.id);
                          toast("Διαγράφηκε.", "success");
                        }
                      }}
                    >
                      Διαγραφή
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          <MobileCards>
            {rows.map((h) => (
              <MobileCard
                key={h.id}
                header={formatDate(h.harvestDate)}
                rows={[
                  { label: "Αγροτεμάχιο", value: fieldName(h.fieldId) },
                  { label: "Τελάρα", value: h.crates },
                  { label: "Κιλά", value: `${h.olivesKg} kg` },
                  { label: "Σημειώσεις", value: h.notes || "—" },
                ]}
                actions={
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(h)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteHarvest(h.id);
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
        title={edit ? "Επεξεργασία συγκομιδής" : "Νέα συγκομιδή"}
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
        <Field label="Αγροτεμάχιο" htmlFor="h-field">
          <Select id="h-field" value={fieldId} onChange={(e) => setFieldId(e.target.value)} required>
            <option value="">Επίλεξε…</option>
            {data.fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ημερομηνία" htmlFor="h-date">
          <Input id="h-date" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} required />
        </Field>
        <Field label="Τελάρα" htmlFor="h-crates" hint="Τα κιλά συμπληρώνονται αυτόματα (× 22,5)">
          <Input id="h-crates" type="number" min={0} value={crates} onChange={(e) => onCrates(e.target.value)} required />
        </Field>
        <Field label="Κιλά ελιών" htmlFor="h-kg">
          <Input id="h-kg" type="number" min={0} value={olivesKg} onChange={(e) => setOlivesKg(e.target.value)} required />
        </Field>
        <Field label="Σημειώσεις" htmlFor="h-notes">
          <Textarea id="h-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
