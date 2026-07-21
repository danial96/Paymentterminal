import { prisma } from "@/lib/prisma";
import { createClient } from "@/app/actions/clients";
import { SubmitButton } from "@/app/components/SubmitButton";

export default async function NewClientPage() {
  const [brands, sellers, managers] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "front_seller" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "project_manager" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">Add Client</h1>

      <form action={createClient} className="flex max-w-xl flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6">
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" />
        <Field label="Medium (lead source)" name="medium" placeholder="e.g. Bark" />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Brand" name="brandId" options={brands} />
          <Select label="Front Seller" name="frontSellerId" options={sellers} />
          <Select label="Project Manager" name="projectManagerId" options={managers} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>

        <SubmitButton className="btn-brand mt-2 self-start rounded-md px-4 py-2 text-sm font-medium text-white" pendingText="Creating...">
          Create Client
        </SubmitButton>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { id: number; name: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <select
        name={name}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
