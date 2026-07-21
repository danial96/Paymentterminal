import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import PortalSidebar from "./PortalSidebar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Login page — no auth check, no sidebar
  if (pathname === "/portal/login") {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "employee") redirect("/portal/login");

  const empDbId = Number((session.user as any).employeeId);
  const emp = await prisma.hRMEmployee.findUnique({ where: { id: empDbId }, select: { employeeId: true } });

  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar
        user={{
          name: session.user.name ?? "",
          employeeId: emp?.employeeId ?? String(empDbId),
        }}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">{children}</main>
    </div>
  );
}
