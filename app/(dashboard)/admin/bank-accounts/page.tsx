"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getBankAccounts,
  saveBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
} from "@/app/actions/bankAccounts";

type BankAccount = {
  id: number;
  label: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  sortCode: string | null;
  iban: string | null;
  swift: string | null;
  isDefault: boolean;
};

const EMPTY = { label: "", bankName: "", accountName: "", accountNumber: "", sortCode: "", iban: "", swift: "" };

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [isPending, startTransition] = useTransition();

  function load() {
    getBankAccounts().then(setAccounts);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(a: BankAccount) {
    setForm({ label: a.label, bankName: a.bankName ?? "", accountName: a.accountName ?? "", accountNumber: a.accountNumber ?? "", sortCode: a.sortCode ?? "", iban: a.iban ?? "", swift: a.swift ?? "" });
    setEditing(a.id);
    setShowForm(true);
  }

  function handleSave() {
    startTransition(async () => {
      await saveBankAccount(editing, form);
      setShowForm(false);
      load();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Bank Accounts</h1>
        <button onClick={openAdd}
          className="btn-brand flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Account
        </button>
      </div>

      <p className="text-sm text-zinc-500">
        Saved bank accounts auto-fill when creating Bank Transfer invoices.
      </p>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-800">{editing ? "Edit Account" : "New Bank Account"}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-zinc-500">Label *</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Main GBP Account" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Bank Name</label>
              <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. Barclays" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Account Name</label>
              <input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} placeholder="e.g. IKIA TECH" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Account Number</label>
              <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="12345678" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Sort Code</label>
              <input value={form.sortCode} onChange={e => setForm(f => ({ ...f, sortCode: e.target.value }))} placeholder="00-00-00" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">IBAN <span className="text-zinc-400 font-normal">(optional)</span></label>
              <input value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="GB00 XXXX 0000 0000 0000 00" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">SWIFT / BIC <span className="text-zinc-400 font-normal">(optional)</span></label>
              <input value={form.swift} onChange={e => setForm(f => ({ ...f, swift: e.target.value }))} placeholder="BARCGB22" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
            <button onClick={handleSave} disabled={isPending || !form.label}
              className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {accounts.length === 0 && !showForm && (
        <p className="text-sm text-zinc-400">No bank accounts saved yet.</p>
      )}
      <div className="flex flex-col gap-3">
        {accounts.map(a => (
          <div key={a.id} className="rounded-lg border border-zinc-200 bg-white p-5 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">{a.label}</span>
                {a.isDefault && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">Default</span>}
              </div>
              <div className="text-sm text-zinc-500 flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                {a.bankName && <span>{a.bankName}</span>}
                {a.accountName && <span>{a.accountName}</span>}
                {a.accountNumber && <span>Acc: {a.accountNumber}</span>}
                {a.sortCode && <span>Sort: {a.sortCode}</span>}
                {a.iban && <span>IBAN: {a.iban}</span>}
                {a.swift && <span>SWIFT: {a.swift}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!a.isDefault && (
                <button onClick={() => startTransition(async () => { await setDefaultBankAccount(a.id); load(); })}
                  className="text-xs text-zinc-400 hover:text-zinc-700 font-medium">Set Default</button>
              )}
              <button onClick={() => openEdit(a)} className="text-xs text-zinc-400 hover:text-zinc-700 font-medium">Edit</button>
              <button onClick={() => startTransition(async () => { await deleteBankAccount(a.id); load(); })}
                className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
