"use client";

import { useState, useTransition } from "react";
import { createInvoice } from "@/app/actions/invoices";

type LineItem = { description: string; quantity: number; unitPrice: number };
type Client = { id: number; name: string; email: string | null; phone: string | null };
type StripeAccount = { id: number; name: string; brandId: number | null };
type Brand = { id: number; name: string };
type BankAccount = { id: number; label: string; bankName: string | null; accountName: string | null; accountNumber: string | null; sortCode: string | null; iban: string | null; swift: string | null };

export default function InvoiceForm({
  clients,
  stripeAccounts,
  brands,
  bankAccounts,
}: {
  clients: Client[];
  stripeAccounts: StripeAccount[];
  brands: Brand[];
  bankAccounts: BankAccount[];
}) {
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "bank_transfer">("stripe");
  const [showBankName, setShowBankName] = useState(true);
  const [bankFields, setBankFields] = useState({ bankName: "", accountName: "", accountNumber: "", sortCode: "", iban: "", swift: "" });
  const [isPending, startTransition] = useTransition();

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const total = subtotal - discountAmount + taxAmount;

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: field === "description" ? value : Number(value) } : item));
  }

  function addItem() { setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]); }
  function removeItem(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  const filteredClients = clientSearch.length > 0
    ? clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 8)
    : [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items));
    fd.set("subtotal", subtotal.toFixed(2));
    fd.set("discountAmount", discountAmount.toFixed(2));
    fd.set("taxPercent", taxPercent.toString());
    startTransition(() => createInvoice(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Client + Details */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Client */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Bill To
            </h2>
            {/* CRM client search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search CRM client..."
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg overflow-hidden">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedClient(c); setClientSearch(c.name); setShowClientDropdown(false); }}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-indigo-50 border-b border-zinc-100 last:border-0"
                    >
                      <span className="text-sm font-medium text-zinc-800">{c.name}</span>
                      {c.email && <span className="text-xs text-zinc-400">{c.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && <input type="hidden" name="clientId" value={selectedClient.id} />}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Client Name *</label>
                <input name="clientName" required defaultValue={selectedClient?.name ?? ""} key={selectedClient?.id ?? "manual"} placeholder="Full name" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Company Name <span className="text-zinc-400 font-normal">(optional)</span></label>
                <input name="clientCompany" placeholder="e.g. Acme Ltd" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Email</label>
                <input name="clientEmail" type="email" defaultValue={selectedClient?.email ?? ""} key={(selectedClient?.id ?? "manual") + "e"} placeholder="client@email.com" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Phone</label>
                <input name="clientPhone" defaultValue={selectedClient?.phone ?? ""} key={(selectedClient?.id ?? "manual") + "p"} placeholder="+44..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs font-medium text-zinc-500">Address</label>
                <input name="clientAddress" placeholder="City, Country" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Line Items
            </h2>
            <div className="mb-2 grid grid-cols-12 gap-2 text-xs font-medium uppercase text-zinc-400 px-1">
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Unit Price</span>
              <span className="col-span-1"></span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="e.g. Website Design"
                  required
                  className="col-span-6 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number" min="1" value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="col-span-2 rounded-md border border-zinc-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">£</span>
                  <input
                    type="number" min="0" step="0.01" value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    className="w-full rounded-md border border-zinc-300 pl-6 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                  className="col-span-1 flex items-center justify-center text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem}
              className="mt-2 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add item
            </button>

            {/* Totals */}
            <div className="mt-4 border-t border-zinc-100 pt-4 flex flex-col items-end gap-1">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-medium w-24 text-right">£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="text-zinc-500 flex items-center gap-2">
                  Discount £
                  <input type="number" min="0" step="0.01" value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-20 rounded border border-zinc-300 px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
                <span className="font-medium w-24 text-right text-red-500">-£{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="text-zinc-500 flex items-center gap-2">
                  Tax
                  <input type="number" min="0" max="100" step="0.5" value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  %
                </label>
                <span className="font-medium w-24 text-right text-zinc-500">£{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm border-t border-zinc-200 pt-2 mt-1">
                <span className="font-semibold text-zinc-800">Total</span>
                <span className="font-bold text-lg text-indigo-600 w-24 text-right">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Notes & Terms
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Notes (visible to client)</label>
                <textarea name="notes" rows={3} placeholder="Thank you for your business..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Terms & Conditions</label>
                <textarea name="terms" rows={3} placeholder="Payment due within 7 days..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Settings */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Invoice Settings
            </h2>

            {/* Payment Method Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Payment Method</label>
              <div className="flex rounded-md overflow-hidden border border-zinc-300">
                <button type="button" onClick={() => setPaymentMethod("stripe")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${paymentMethod === "stripe" ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                  Stripe
                </button>
                <button type="button" onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-zinc-300 ${paymentMethod === "bank_transfer" ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                  Bank Transfer
                </button>
              </div>
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
              <input type="hidden" name="showBankName" value={showBankName ? "true" : "false"} />
            </div>

            {paymentMethod === "stripe" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">Stripe Account</label>
                <select name="stripeAccountId" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Select account —</option>
                  {stripeAccounts.filter((a) => a).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentMethod === "bank_transfer" && (
              <div className="flex flex-col gap-3">
                {bankAccounts.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Saved Account</label>
                    <select
                      onChange={(e) => {
                        const acc = bankAccounts.find(a => String(a.id) === e.target.value);
                        if (acc) setBankFields({ bankName: acc.bankName ?? "", accountName: acc.accountName ?? "", accountNumber: acc.accountNumber ?? "", sortCode: acc.sortCode ?? "", iban: acc.iban ?? "", swift: acc.swift ?? "" });
                      }}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Pick saved account —</option>
                      {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Bank Name</label>
                  <input name="bankName" value={bankFields.bankName} onChange={e => setBankFields(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. Barclays" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                    <input type="checkbox" checked={showBankName} onChange={e => setShowBankName(e.target.checked)} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs text-zinc-500">Show bank name on invoice</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Account Name</label>
                  <input name="bankAccountName" value={bankFields.accountName} onChange={e => setBankFields(f => ({ ...f, accountName: e.target.value }))} placeholder="e.g. IKIA TECH" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Account Number</label>
                    <input name="bankAccountNumber" value={bankFields.accountNumber} onChange={e => setBankFields(f => ({ ...f, accountNumber: e.target.value }))} placeholder="12345678" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Sort Code</label>
                    <input name="bankSortCode" value={bankFields.sortCode} onChange={e => setBankFields(f => ({ ...f, sortCode: e.target.value }))} placeholder="00-00-00" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">IBAN <span className="text-zinc-400 font-normal">(optional)</span></label>
                  <input name="bankIban" value={bankFields.iban} onChange={e => setBankFields(f => ({ ...f, iban: e.target.value }))} placeholder="GB00 XXXX 0000 0000 0000 00" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">SWIFT / BIC <span className="text-zinc-400 font-normal">(optional)</span></label>
                  <input name="bankSwift" value={bankFields.swift} onChange={e => setBankFields(f => ({ ...f, swift: e.target.value }))} placeholder="BARCGB22" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Brand</label>
              <select name="brandId" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select brand —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Currency</label>
              <select name="currency" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="gbp">GBP (£)</option>
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="pkr">PKR (₨)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Due Date</label>
              <input type="date" name="dueDate" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Creating...</>
            ) : (
              <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Create Invoice</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
