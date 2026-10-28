"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, MobileCard, MobileCards } from "@/components/ui/data-list";
import { EmptyState, PageHeader, Panel } from "@/components/ui/page-header";
import { NoSeasonState } from "@/components/shell/no-season";
import { useToast } from "@/components/ui/toast";
import { centsToEuros, eurosToCents, formatCurrency, formatDate, todayISO } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { TransactionType, Tx } from "@/lib/types";

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Έσοδο",
  expense: "Έξοδο",
  donation: "Δωρεά",
};

export default function TransactionsPage() {
  const { data, activeSeason, saveTx, deleteTx } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Tx | null>(null);
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  if (!activeSeason) {
    return (
      <>
        <PageHeader title="Έσοδα & έξοδα" />
        <NoSeasonState />
      </>
    );
  }

  const rows = data.transactions
    .filter((t) => t.seasonId === activeSeason.id)
    .slice()
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

  function openCreate() {
    setEdit(null);
    setType("expense");
    setCategory("");
    setTransactionDate(todayISO());
    setDescription("");
    setAmount("");
    setNotes("");
    setOpen(true);
  }

  function openEdit(t: Tx) {
    setEdit(t);
    setType(t.type);
    setCategory(t.category);
    setTransactionDate(t.transactionDate);
    setDescription(t.description);
    setAmount(String(centsToEuros(t.amount)));
    setNotes(t.notes);
    setOpen(true);
  }

  function save() {
    if (!description.trim()) {
      toast("Πρόσθεσε περιγραφή.", "danger");
      return;
    }
    const euros = Number(amount);
    if (Number.isNaN(euros) || euros < 0) {
      toast("Μη έγκυρο ποσό.", "danger");
      return;
    }
    saveTx({
      id: edit?.id,
      seasonId: activeSeason!.id,
      type,
      category: category.trim(),
      transactionDate,
      description: description.trim(),
      amount: eurosToCents(euros),
      notes,
    } as Parameters<typeof saveTx>[0]);
    toast(edit ? "Η κίνηση ενημερώθηκε." : "Καταχωρήθηκε κίνηση.", "success");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Έσοδα & έξοδα"
        description={`Οικονομικές κινήσεις περιόδου ${activeSeason.name}`}
        actions={<Button onClick={openCreate}>Νέα κίνηση</Button>}
      />

      {rows.length === 0 ? (
        <EmptyState
          message="Δεν υπάρχουν χειροκίνητες κινήσεις — μόνο αυτόματα έσοδα από πωλήσεις λαδιού."
          action={<Button onClick={openCreate}>Πρώτη καταχώρηση</Button>}
        />
      ) : (
        <Panel>
          <DataTable
            headers={["Ημερομηνία", "Τύπος", "Κατηγορία", "Περιγραφή", "Ποσό", "Σημειώσεις", "Ενέργειες"]}
          >
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">{formatDate(t.transactionDate)}</td>
                <td className="px-4 py-3">{TYPE_LABEL[t.type]}</td>
                <td className="px-4 py-3">{t.category || "—"}</td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(t.amount)}</td>
                <td className="px-4 py-3">{t.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή κίνησης;")) {
                          deleteTx(t.id);
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
            {rows.map((t) => (
              <MobileCard
                key={t.id}
                header={formatDate(t.transactionDate)}
                rows={[
                  { label: "Τύπος", value: TYPE_LABEL[t.type] },
                  { label: "Κατηγορία", value: t.category || "—" },
                  { label: "Περιγραφή", value: t.description },
                  { label: "Ποσό", value: formatCurrency(t.amount) },
                  { label: "Σημειώσεις", value: t.notes || "—" },
                ]}
                actions={
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Διαγραφή;")) {
                          deleteTx(t.id);
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
        title={edit ? "Επεξεργασία κίνησης" : "Νέα κίνηση"}
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
        <Field label="Τύπος" htmlFor="tx-type">
          <Select id="tx-type" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
            <option value="income">Έσοδο</option>
            <option value="expense">Έξοδο</option>
            <option value="donation">Δωρεά</option>
          </Select>
        </Field>
        <Field label="Ημερομηνία" htmlFor="tx-date">
          <Input
            id="tx-date"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </Field>
        <Field label="Κατηγορία" htmlFor="tx-cat" hint="Προαιρετική ετικέτα (π.χ. εργατικά, λιπάσματα)">
          <Input id="tx-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
        </Field>
        <Field label="Περιγραφή" htmlFor="tx-desc">
          <Input id="tx-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </Field>
        <Field label="Ποσό (€)" htmlFor="tx-amt">
          <Input
            id="tx-amt"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Σημειώσεις" htmlFor="tx-notes">
          <Textarea id="tx-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
