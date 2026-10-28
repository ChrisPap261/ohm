"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { formatDate, todayISO } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Season } from "@/lib/types";

export default function SeasonsPage() {
  const { data, saveSeason, deleteSeason, activateSeason } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Season | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [isActive, setIsActive] = useState(false);

  function openCreate() {
    setEdit(null);
    setName("");
    setStartDate(todayISO());
    setEndDate(todayISO());
    setIsActive(data.seasons.length === 0);
    setOpen(true);
  }

  function openEdit(s: Season) {
    setEdit(s);
    setName(s.name);
    setStartDate(s.startDate);
    setEndDate(s.endDate);
    setIsActive(s.isActive);
    setOpen(true);
  }

  function save() {
    if (endDate < startDate) {
      toast("Η λήξη πρέπει να είναι μετά την έναρξη.", "danger");
      return;
    }
    saveSeason({
      id: edit?.id,
      name,
      startDate,
      endDate,
      isActive,
    });
    toast(edit ? "Η περίοδος ενημερώθηκε." : "Η περίοδος προστέθηκε.", "success");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Περίοδοι"
        description="Ορισμός και ενεργοποίηση περιόδου εργασίας"
        actions={<Button onClick={openCreate}>Νέα περίοδος</Button>}
      />

      {data.seasons.length === 0 ? (
        <EmptyState
          message="Δεν υπάρχουν περίοδοι ακόμα."
          action={<Button onClick={openCreate}>Πρώτη περίοδος</Button>}
        />
      ) : (
        <Panel>
          <DataTable
            headers={["Όνομα", "Έναρξη", "Λήξη", "Κατάσταση", "Ενέργειες"]}
          >
            {data.seasons.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{formatDate(s.startDate)}</td>
                <td className="px-4 py-3">{formatDate(s.endDate)}</td>
                <td className="px-4 py-3">
                  {s.isActive ? (
                    <span className="rounded-full bg-[var(--color-accent-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                      Ενεργή
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">Ανενεργή</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {!s.isActive ? (
                      <Button size="sm" variant="secondary" onClick={() => activateSeason(s.id)}>
                        Ενεργοποίηση
                      </Button>
                    ) : null}
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή περιόδου και όλων των σχετικών καταχωρήσεων;")) {
                          deleteSeason(s.id);
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
            {data.seasons.map((s) => (
              <MobileCard
                key={s.id}
                header={s.name}
                rows={[
                  { label: "Έναρξη", value: formatDate(s.startDate) },
                  { label: "Λήξη", value: formatDate(s.endDate) },
                  { label: "Κατάσταση", value: s.isActive ? "Ενεργή" : "Ανενεργή" },
                ]}
                actions={
                  <>
                    {!s.isActive ? (
                      <Button size="sm" variant="secondary" onClick={() => activateSeason(s.id)}>
                        Ενεργοποίηση
                      </Button>
                    ) : null}
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteSeason(s.id);
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
        title={edit ? "Επεξεργασία περιόδου" : "Νέα περίοδος"}
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
        <Field label="Όνομα" htmlFor="season-name">
          <Input id="season-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="π.χ. 2026-27" />
        </Field>
        <Field label="Ημερομηνία έναρξης" htmlFor="season-start">
          <Input id="season-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Ημερομηνία λήξης" htmlFor="season-end">
          <Input id="season-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Ορισμός ως ενεργή περίοδος
        </label>
      </Modal>
    </>
  );
}
