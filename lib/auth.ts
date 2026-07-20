import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "employee-portal",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const emp = await prisma.hRMEmployee.findUnique({ where: { portalEmail: email } });
        if (!emp || !emp.portalEnabled || !emp.portalPassword) return null;

        const isValid = await bcrypt.compare(password, emp.portalPassword);
        if (!isValid) return null;

        return {
          id: String(emp.id),
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.portalEmail,
          role: "employee",
          employeeId: String(emp.id),
        } as any;
      },
    }),
  ],
});
