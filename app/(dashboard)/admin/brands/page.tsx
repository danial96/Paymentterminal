import { prisma } from "@/lib/prisma";
import { createBrand, deleteBrand } from "@/app/actions/admin";
import BrandLogoUpload from "./BrandLogoUpload";
import BrandDetailsEditor from "./BrandDetailsEditor";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-lg font-semibold text-zinc-900">Brands</h1>

      <form action={createBrand} className="flex max-w-md gap-2">
        <input
          type="text"
          name="name"
          placeholder="New brand name"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Add
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {brands.map((b) => (
          <div key={b.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {/* Brand header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-3">
                <BrandLogoUpload brandId={b.id} initialLogo={b.logoUrl ?? null} />
                <span className="font-semibold text-zinc-800 text-sm">{b.name}</span>
              </div>
              <form action={deleteBrand.bind(null, b.id)}>
                <button className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
              </form>
            </div>
            {/* Company details */}
            <BrandDetailsEditor
              brandId={b.id}
              initialAddress={b.address ?? ""}
              initialPhone={b.phone ?? ""}
              initialEmail={b.email ?? ""}
              initialWebsite={b.website ?? ""}
              initialBrandColor={(b as { brandColor?: string | null }).brandColor ?? "#1a1a2e"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
