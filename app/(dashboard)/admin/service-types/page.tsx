import { prisma } from "@/lib/prisma";
import { createServiceType } from "@/app/actions/admin";
import ServiceTypeList from "./ServiceTypeList";

export default async function ServiceTypesPage() {
  const serviceTypes = await prisma.serviceType.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">Service Types</h1>
      <p className="text-sm text-zinc-500">
        This list is admin-managed only — the Google Sheet sync never creates new service types
        here, it matches each Sheet row to the closest existing type.
      </p>

      <form action={createServiceType} className="flex max-w-2xl flex-wrap items-center gap-2">
        <input
          type="text"
          name="name"
          placeholder="e.g. Email Hosting"
          required
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-1 whitespace-nowrap text-sm text-zinc-600">
          <input type="checkbox" name="isRecurring" /> Recurring
        </label>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Add
        </button>
      </form>

      <ServiceTypeList serviceTypes={serviceTypes} />
    </div>
  );
}
