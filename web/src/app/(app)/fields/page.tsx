"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Field as FieldRow } from "@/lib/types";

export default function FieldsPage() {
  const { data, saveField, deleteField } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<FieldRow | null>(null);
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [edit, setEdit] = useState<FieldRow | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [treeCount, setTreeCount] = useState("");

  function openCreate() {
    setEdit(null);
    setName("");
    setLocation("");
    setArea("");
    setTreeCount("");
    setOpen(true);
  }

  function openEdit(f: FieldRow) {
    setEdit(f);
    setName(f.name);
    setLocation(f.location);
    setArea(f.area?.toString() ?? "");
    setTreeCount(f.treeCount?.toString() ?? "");
    setOpen(true);
  }

  function save() {
    saveField({
      id: edit?.id,
      name,
      location,
      area: area ? Number(area) : null,
      treeCount: treeCount ? Number(treeCount) : null,
    });
    toast(edit ? "Ενημερώθηκε." : "Προστέθηκε αγροτεμάχιο.", "success");
    setOpen(false);
  }

  const harvests = detail
    ? data.harvests.filter((h) => {
        if (h.fieldId !== detail.id) return false;
        if (seasonFilter === "all") return true;
        return h.seasonId === seasonFilter;
      })
    : [];

  return (
    <>
      <PageHeader
        title="Αγροτεμάχια"
        description="Χωράφια και δέντρα"
        actions={<Button onClick={openCreate}>Νέο αγροτεμάχιο</Button>}
      />

      {detail ? (
        <Panel className="mb-6 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{detail.name}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">{detail.location || "Χωρίς τοποθεσία"}</p>
            </div>
            <div className="flex gap-2">
              <Select
                aria-label="Φίλτρο περιόδου"
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="w-auto"
              >
                <option value="all">Όλες οι περίοδοι</option>
                {data.seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Πίσω
              </Button>
            </div>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 text-sm">
              Συγκομιδές: <strong>{harvests.length}</strong>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 text-sm">
              Τελάρα: <strong>{harvests.reduce((a, h) => a + h.crates, 0)}</strong>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 text-sm">
              Κιλά: <strong>{harvests.reduce((a, h) => a + h.olivesKg, 0)}</strong>
            </div>
          </div>
          {harvests.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Καμία συγκομιδή σε αυτό το φίλτρο.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] text-sm">
              {harvests.map((h) => (
                <li key={h.id} className="flex justify-between gap-3 py-2">
                  <span>{formatDate(h.harvestDate)}</span>
                  <span>
                    {h.crates} τελάρα · {h.olivesKg} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {data.fields.length === 0 ? (
        <EmptyState
          message="Δεν έχουν καταχωρηθεί αγροτεμάχια."
          action={<Button onClick={openCreate}>Προσθήκη</Button>}
        />
      ) : (
        <Panel>
          <DataTable headers={["Όνομα", "Τοποθεσία", "Έκταση", "Δέντρα", "Ενέργειες"]}>
            {data.fields.map((f) => (
              <tr key={f.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3 font-medium">{f.name}</td>
                <td className="px-4 py-3">{f.location || "—"}</td>
                <td className="px-4 py-3">{f.area != null ? `${f.area} τ.μ.` : "—"}</td>
                <td className="px-4 py-3">{f.treeCount ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDetail(f)}>
                      Κάρτα
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(f)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή αγροτεμαχίου;")) {
                          deleteField(f.id);
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
            {data.fields.map((f) => (
              <MobileCard
                key={f.id}
                header={f.name}
                rows={[
                  { label: "Τοποθεσία", value: f.location || "—" },
                  { label: "Έκταση", value: f.area != null ? `${f.area} τ.μ.` : "—" },
                  { label: "Δέντρα", value: f.treeCount ?? "—" },
                ]}
                actions={
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setDetail(f)}>
                      Κάρτα
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(f)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteField(f.id);
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
        title={edit ? "Επεξεργασία αγροτεμαχίου" : "Νέο αγροτεμάχιο"}
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
        <Field label="Όνομα" htmlFor="field-name">
          <Input id="field-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Τοποθεσία" htmlFor="field-loc">
          <Input id="field-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Έκταση (τ.μ.)" htmlFor="field-area">
          <Input id="field-area" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} />
        </Field>
        <Field label="Αριθμός δέντρων" htmlFor="field-trees">
          <Input id="field-trees" type="number" min={0} value={treeCount} onChange={(e) => setTreeCount(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
