"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { NoSeasonState } from "@/components/shell/no-season";
import { StatusSwitch } from "@/components/ui/status-switch";
import { useToast } from "@/components/ui/toast";
import {
  centsToEuros,
  eurosToCents,
  formatCurrency,
  formatDate,
  todayISO,
} from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Customer, OilSale } from "@/lib/types";

export default function OilSalesPage() {
  const {
    data,
    activeSeason,
    saveOilSale,
    deleteOilSale,
    updateOilSaleStatus,
    searchCustomers,
  } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<OilSale | null>(null);
  const [saleDate, setSaleDate] = useState(todayISO());
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [buyer, setBuyer] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [delivered, setDelivered] = useState(false);
  const [paid, setPaid] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const suggestions = useMemo(
    () => (suggestOpen ? searchCustomers(buyer) : []),
    [buyer, searchCustomers, suggestOpen],
  );

  if (!activeSeason) {
    return (
      <>
        <PageHeader title="Πωλήσεις ελαιόλαδου" />
        <NoSeasonState />
      </>
    );
  }

  const rows = data.oilSales
    .filter((s) => s.seasonId === activeSeason.id)
    .slice()
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate));

  function openCreate() {
    setEdit(null);
    setSaleDate(todayISO());
    setLiters("");
    setPricePerLiter("");
    setBuyer("");
    setCustomerId(null);
    setNotes("");
    setDelivered(false);
    setPaid(false);
    setSuggestOpen(false);
    setOpen(true);
  }

  function openEdit(s: OilSale) {
    setEdit(s);
    setSaleDate(s.saleDate);
    setLiters(String(s.oilLiters));
    setPricePerLiter(String(centsToEuros(s.pricePerLiter)));
    setBuyer(s.buyer);
    setCustomerId(s.customerId);
    setNotes(s.notes);
    setDelivered(s.delivered);
    setPaid(s.paid);
    setSuggestOpen(false);
    setOpen(true);
  }

  function pickCustomer(c: Customer) {
    setBuyer(c.name);
    setCustomerId(c.id);
    setSuggestOpen(false);
  }

  function save() {
    const L = Number(liters);
    const priceCents = eurosToCents(Number(pricePerLiter));
    if (!buyer.trim()) {
      toast("Συμπλήρωσε τον αγοραστή.", "danger");
      return;
    }
    if (Number.isNaN(L) || L < 0) {
      toast("Μη έγκυρα λίτρα.", "danger");
      return;
    }
    saveOilSale({
      id: edit?.id,
      seasonId: activeSeason!.id,
      customerId,
      saleDate,
      oilLiters: L,
      pricePerLiter: priceCents,
      totalAmount: Math.round(L * priceCents),
      buyer: buyer.trim(),
      notes,
      delivered,
      paid,
    } as Parameters<typeof saveOilSale>[0]);
    toast(edit ? "Η πώληση ενημερώθηκε." : "Καταχωρήθηκε πώληση λαδιού.", "success");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Πωλήσεις ελαιόλαδου"
        description={`Περίοδος ${activeSeason.name} · τιμές και παράδοση ανά πελάτη`}
        actions={<Button onClick={openCreate}>Νέα πώληση</Button>}
      />

      {rows.length === 0 ? (
        <EmptyState
          message="Δεν έχεις καταχωρήσει πωλήσεις λαδιού για αυτή την περίοδο."
          action={<Button onClick={openCreate}>Πρώτη πώληση</Button>}
        />
      ) : (
        <Panel>
          <DataTable
            headers={[
              "Ημερομηνία",
              "Αγοραστής",
              "Λίτρα",
              "Τιμή / L",
              "Σύνολο",
              "Παράδοση",
              "Πληρωμή",
              "Σημειώσεις",
              "Ενέργειες",
            ]}
          >
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">{formatDate(s.saleDate)}</td>
                <td className="px-4 py-3">{s.buyer}</td>
                <td className="px-4 py-3">{s.oilLiters} L</td>
                <td className="px-4 py-3">{formatCurrency(s.pricePerLiter)}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(s.totalAmount)}</td>
                <td className="px-4 py-3">
                  <StatusSwitch
                    label="Παρ."
                    checked={s.delivered}
                    onChange={(next) => updateOilSaleStatus(s.id, { delivered: next })}
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusSwitch
                    label="Πληρ."
                    checked={s.paid}
                    onChange={(next) => updateOilSaleStatus(s.id, { paid: next })}
                  />
                </td>
                <td className="px-4 py-3">{s.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή πώλησης;")) {
                          deleteOilSale(s.id);
                          toast("Η εγγραφή διαγράφηκε.", "success");
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
            {rows.map((s) => (
              <MobileCard
                key={s.id}
                header={`${formatDate(s.saleDate)} · ${s.buyer}`}
                rows={[
                  { label: "Λίτρα", value: `${s.oilLiters} L` },
                  { label: "Τιμή / L", value: formatCurrency(s.pricePerLiter) },
                  { label: "Σύνολο", value: formatCurrency(s.totalAmount) },
                  { label: "Σημειώσεις", value: s.notes || "—" },
                ]}
                actions={
                  <>
                    <StatusSwitch
                      label="Παραδόθηκε"
                      checked={s.delivered}
                      onChange={(next) => updateOilSaleStatus(s.id, { delivered: next })}
                    />
                    <StatusSwitch
                      label="Πληρώθηκε"
                      checked={s.paid}
                      onChange={(next) => updateOilSaleStatus(s.id, { paid: next })}
                    />
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteOilSale(s.id);
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
        title={edit ? "Επεξεργασία πώλησης λαδιού" : "Νέα πώληση λαδιού"}
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
        <Field label="Ημερομηνία" htmlFor="os-date">
          <Input
            id="os-date"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
          />
        </Field>
        <Field label="Λίτρα" htmlFor="os-liters">
          <Input
            id="os-liters"
            type="number"
            min={0}
            step="0.1"
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            required
          />
        </Field>
        <Field label="Τιμή ανά λίτρο (€)" htmlFor="os-price">
          <Input
            id="os-price"
            type="number"
            min={0}
            step="0.01"
            value={pricePerLiter}
            onChange={(e) => setPricePerLiter(e.target.value)}
            required
          />
        </Field>
        <Field label="Αγοραστής" htmlFor="os-buyer" hint="Αναζήτηση στους πελάτες ή ελεύθερο κείμενο">
          <div className="relative">
            <Input
              id="os-buyer"
              value={buyer}
              onChange={(e) => {
                setBuyer(e.target.value);
                setCustomerId(null);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
              autoComplete="off"
              required
            />
            {suggestions.length > 0 && suggestOpen ? (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
                {suggestions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg)]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickCustomer(c)}
                    >
                      {c.name}
                      {c.phone ? (
                        <span className="ml-2 text-[var(--color-text-muted)]">{c.phone}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Field>
        <Field label="Σημειώσεις" htmlFor="os-notes">
          <Textarea id="os-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-6 pt-1">
          <StatusSwitch label="Παραδόθηκε" checked={delivered} onChange={setDelivered} />
          <StatusSwitch label="Πληρώθηκε" checked={paid} onChange={setPaid} />
        </div>
        {liters && pricePerLiter ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Εκτιμώμενο σύνολο:{" "}
            <strong>
              {formatCurrency(Math.round(Number(liters) * eurosToCents(Number(pricePerLiter))))}
            </strong>
          </p>
        ) : null}
      </Modal>
    </>
  );
}
