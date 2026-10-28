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
import type { Customer, OliveSale } from "@/lib/types";

export default function OliveSalesPage() {
  const {
    data,
    activeSeason,
    saveOliveSale,
    deleteOliveSale,
    updateOliveSaleStatus,
    searchCustomers,
  } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<OliveSale | null>(null);
  const [saleDate, setSaleDate] = useState(todayISO());
  const [olivesKg, setOlivesKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
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
        <PageHeader title="Πωλήσεις ελιών" />
        <NoSeasonState />
      </>
    );
  }

  const rows = data.oliveSales
    .filter((s) => s.seasonId === activeSeason.id)
    .slice()
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate));

  function openCreate() {
    setEdit(null);
    setSaleDate(todayISO());
    setOlivesKg("");
    setPricePerKg("");
    setBuyer("");
    setCustomerId(null);
    setNotes("");
    setDelivered(false);
    setPaid(false);
    setSuggestOpen(false);
    setOpen(true);
  }

  function openEdit(s: OliveSale) {
    setEdit(s);
    setSaleDate(s.saleDate);
    setOlivesKg(String(s.olivesKg));
    setPricePerKg(String(centsToEuros(s.pricePerKg)));
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
    const kg = Number(olivesKg);
    const priceCents = eurosToCents(Number(pricePerKg));
    if (!buyer.trim()) {
      toast("Συμπλήρωσε τον αγοραστή.", "danger");
      return;
    }
    if (Number.isNaN(kg) || kg < 0) {
      toast("Μη έγκυρα κιλά.", "danger");
      return;
    }
    saveOliveSale({
      id: edit?.id,
      seasonId: activeSeason!.id,
      customerId,
      saleDate,
      olivesKg: kg,
      pricePerKg: priceCents,
      totalAmount: Math.round(kg * priceCents),
      buyer: buyer.trim(),
      notes,
      delivered,
      paid,
    } as Parameters<typeof saveOliveSale>[0]);
    toast(edit ? "Η πώληση ενημερώθηκε." : "Καταχωρήθηκε πώληση ελιών.", "success");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Πωλήσεις ελιών"
        description={`Περίοδος ${activeSeason.name} · χονδρική ή λιανική ανά κιλό`}
        actions={<Button onClick={openCreate}>Νέα πώληση</Button>}
      />

      {rows.length === 0 ? (
        <EmptyState
          message="Καμία πώληση ελιών σε αυτή την περίοδο — πρόσθεσε την πρώτη."
          action={<Button onClick={openCreate}>Καταχώρηση</Button>}
        />
      ) : (
        <Panel>
          <DataTable
            headers={[
              "Ημερομηνία",
              "Αγοραστής",
              "Κιλά",
              "Τιμή / kg",
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
                <td className="px-4 py-3">{s.olivesKg} kg</td>
                <td className="px-4 py-3">{formatCurrency(s.pricePerKg)}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(s.totalAmount)}</td>
                <td className="px-4 py-3">
                  <StatusSwitch
                    label="Παρ."
                    checked={s.delivered}
                    onChange={(next) => updateOliveSaleStatus(s.id, { delivered: next })}
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusSwitch
                    label="Πληρ."
                    checked={s.paid}
                    onChange={(next) => updateOliveSaleStatus(s.id, { paid: next })}
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
                          deleteOliveSale(s.id);
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
                  { label: "Κιλά", value: `${s.olivesKg} kg` },
                  { label: "Τιμή / kg", value: formatCurrency(s.pricePerKg) },
                  { label: "Σύνολο", value: formatCurrency(s.totalAmount) },
                  { label: "Σημειώσεις", value: s.notes || "—" },
                ]}
                actions={
                  <>
                    <StatusSwitch
                      label="Παραδόθηκε"
                      checked={s.delivered}
                      onChange={(next) => updateOliveSaleStatus(s.id, { delivered: next })}
                    />
                    <StatusSwitch
                      label="Πληρώθηκε"
                      checked={s.paid}
                      onChange={(next) => updateOliveSaleStatus(s.id, { paid: next })}
                    />
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteOliveSale(s.id);
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
        title={edit ? "Επεξεργασία πώλησης ελιών" : "Νέα πώληση ελιών"}
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
        <Field label="Ημερομηνία" htmlFor="ol-date">
          <Input
            id="ol-date"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
          />
        </Field>
        <Field label="Κιλά ελιών" htmlFor="ol-kg">
          <Input
            id="ol-kg"
            type="number"
            min={0}
            step="0.1"
            value={olivesKg}
            onChange={(e) => setOlivesKg(e.target.value)}
            required
          />
        </Field>
        <Field label="Τιμή ανά κιλό (€)" htmlFor="ol-price">
          <Input
            id="ol-price"
            type="number"
            min={0}
            step="0.01"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            required
          />
        </Field>
        <Field label="Αγοραστής" htmlFor="ol-buyer">
          <div className="relative">
            <Input
              id="ol-buyer"
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
        <Field label="Σημειώσεις" htmlFor="ol-notes">
          <Textarea id="ol-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-6 pt-1">
          <StatusSwitch label="Παραδόθηκε" checked={delivered} onChange={setDelivered} />
          <StatusSwitch label="Πληρώθηκε" checked={paid} onChange={setPaid} />
        </div>
        {olivesKg && pricePerKg ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Εκτιμώμενο σύνολο:{" "}
            <strong>
              {formatCurrency(Math.round(Number(olivesKg) * eurosToCents(Number(pricePerKg))))}
            </strong>
          </p>
        ) : null}
      </Modal>
    </>
  );
}
