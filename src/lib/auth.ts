import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { resolveOrgFromEmail } from "@/lib/resolve-org";

const basePrismaAdapter = PrismaAdapter(db);

const prismaAdapter: Adapter = {
  ...basePrismaAdapter,
  createUser: async (data) => {
    const created = await db.user.create({
      data: {
        email: data.email,
        name: data.name ?? data.email.split("@")[0],
        avatarUrl: data.image ?? null,
        emailVerified: data.emailVerified ?? null,
        profileCompleted: false,
      },
    });
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      image: created.avatarUrl,
      emailVerified: created.emailVerified,
    } as AdapterUser;
  },
};

export const authConfig: NextAuthConfig = {
  adapter: prismaAdapter,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    newUser: "/complete-profile",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!isValid) return null;

        // Block unverified organizers from logging in
        if (user.role === "ORGANIZER" && !user.isVerified) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            role: true,
            department: true,
            orgId: true,
            isVerified: true,
            profileCompleted: true,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.department = dbUser.department;
          token.isVerified = dbUser.isVerified;
          token.profileCompleted = dbUser.profileCompleted;

          // Auto-assign org from email domain for OAuth users who don't have one
          if (!dbUser.orgId && token.email) {
            const resolved = await resolveOrgFromEmail(token.email);
            if (resolved) {
              await db.user.update({
                where: { id: dbUser.id },
                data: { orgId: resolved.orgId },
              });
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.id = token.id;
        user.role = token.role;
        user.department = token.department;
        user.isVerified = token.isVerified;
        user.profileCompleted = token.profileCompleted;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
