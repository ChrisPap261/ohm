"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const { data, saveCustomer, deleteCustomer } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const customers = data.customers.slice().sort((a, b) => a.name.localeCompare(b.name, "el"));

  const detailStats = useMemo(() => {
    if (!detail) return null;
    const oil = data.oilSales.filter((s) => s.customerId === detail.id);
    const olives = data.oliveSales.filter((s) => s.customerId === detail.id);
    const oilLiters = oil.reduce((a, s) => a + s.oilLiters, 0);
    const oliveKg = olives.reduce((a, s) => a + s.olivesKg, 0);
    const oilTotal = oil.reduce((a, s) => a + s.totalAmount, 0);
    const oliveTotal = olives.reduce((a, s) => a + s.totalAmount, 0);
    return { oil, olives, oilLiters, oliveKg, oilTotal, oliveTotal, grand: oilTotal + oliveTotal };
  }, [detail, data.oilSales, data.oliveSales]);

  function openCreate() {
    setEdit(null);
    setName("");
    setPhone("");
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEdit(c);
    setName(c.name);
    setPhone(c.phone);
    setOpen(true);
  }

  function save() {
    if (!name.trim()) {
      toast("Το όνομα είναι υποχρεωτικό.", "danger");
      return;
    }
    saveCustomer({
      id: edit?.id,
      name: name.trim(),
      phone: phone.trim(),
    } as Parameters<typeof saveCustomer>[0]);
    toast(edit ? "Ο πελάτης ενημερώθηκε." : "Προστέθηκε νέος πελάτης.", "success");
    setOpen(false);
    if (detail && edit?.id === detail.id) {
      setDetail({ ...detail, name: name.trim(), phone: phone.trim() });
    }
  }

  return (
    <>
      <PageHeader
        title="Πελάτες"
        description="Κατάλογος αγοραστών λαδιού και ελιών"
        actions={<Button onClick={openCreate}>Νέος πελάτης</Button>}
      />

      {detail && detailStats ? (
        <Panel className="mb-6 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{detail.name}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {detail.phone || "Χωρίς τηλέφωνο"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(detail)}>
                Επεξεργασία
              </Button>
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Κλείσιμο
              </Button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 text-sm">
              Λάδι: <strong>{detailStats.oilLiters} L</strong>
              <div className="text-[var(--color-text-muted)]">{formatCurrency(detailStats.oilTotal)}</div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 text-sm">
              Ελιές: <strong>{detailStats.oliveKg} kg</strong>
              <div className="text-[var(--color-text-muted)]">{formatCurrency(detailStats.oliveTotal)}</div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-surface)] p-3 text-sm">
              Σύνολο αγορών: <strong>{formatCurrency(detailStats.grand)}</strong>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="mb-2 font-semibold">Πωλήσεις ελαιόλαδου</h3>
              {detailStats.oil.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">Δεν υπάρχουν συνδεδεμένες πωλήσεις λαδιού.</p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)] text-sm">
                  {detailStats.oil.map((s) => (
                    <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2">
                      <span>{formatDate(s.saleDate)}</span>
                      <span>
                        {s.oilLiters} L · {formatCurrency(s.totalAmount)}
                        {s.paid ? " · πληρωμένο" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Πωλήσεις ελιών</h3>
              {detailStats.olives.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">Δεν υπάρχουν συνδεδεμένες πωλήσεις ελιών.</p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)] text-sm">
                  {detailStats.olives.map((s) => (
                    <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2">
                      <span>{formatDate(s.saleDate)}</span>
                      <span>
                        {s.olivesKg} kg · {formatCurrency(s.totalAmount)}
                        {s.delivered ? " · παραδόθηκε" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </Panel>
      ) : null}

      {customers.length === 0 ? (
        <EmptyState
          message="Ο κατάλογος πελατών είναι άδειος — πρόσθεσε τον πρώτο επαφή."
          action={<Button onClick={openCreate}>Προσθήκη πελάτη</Button>}
        />
      ) : (
        <Panel>
          <DataTable headers={["Όνομα", "Τηλέφωνο", "Ενέργειες"]}>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDetail(c)}>
                      Ιστορικό
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή πελάτη; Οι πωλήσεις θα μείνουν χωρίς σύνδεση.")) {
                          deleteCustomer(c.id);
                          if (detail?.id === c.id) setDetail(null);
                          toast("Ο πελάτης αφαιρέθηκε.", "success");
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
            {customers.map((c) => (
              <MobileCard
                key={c.id}
                header={c.name}
                rows={[{ label: "Τηλέφωνο", value: c.phone || "—" }]}
                actions={
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setDetail(c)}>
                      Ιστορικό
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteCustomer(c.id);
                          if (detail?.id === c.id) setDetail(null);
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
        title={edit ? "Επεξεργασία πελάτη" : "Νέος πελάτης"}
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
        <Field label="Ονοματεπώνυμο / επωνυμία" htmlFor="cust-name">
          <Input id="cust-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Τηλέφωνο" htmlFor="cust-phone">
          <Input
            id="cust-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="π.χ. 6901234567"
          />
        </Field>
      </Modal>
    </>
  );
}
