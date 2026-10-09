import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-zinc-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-zinc-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-zinc-600">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
