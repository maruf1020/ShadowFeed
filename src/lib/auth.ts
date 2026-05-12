import { compare } from "bcryptjs";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type SessionUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
  username: string;
  fakeEmail: string;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "ShadowFeed Credentials",
      credentials: {
        identifier: {
          label: "Username or fake email",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials, request) {
        const identifier = credentials?.identifier?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";

        if (!identifier || !password) {
          return null;
        }

        const profile = await prisma.publicProfile.findFirst({
          where: {
            OR: [{ username: identifier }, { fakeEmail: identifier }],
          },
          include: {
            user: {
              include: {
                suspensions: {
                  where: { isActive: true },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        });

        const ipAddress = request?.headers?.["x-forwarded-for"] ?? null;
        const userAgent = request?.headers?.["user-agent"] ?? null;

        if (!profile) {
          await logAuditEvent({
            action: "LOGIN_FAILED",
            entityType: "auth",
            details: { reason: "profile_not_found", identifier },
            ipAddress,
            userAgent,
          });

          return null;
        }

        const activeSuspension = profile.user.suspensions[0];
        if (activeSuspension) {
          await logAuditEvent({
            userId: profile.userId,
            action:
              activeSuspension.type === "BANNED" ? "USER_BANNED" : "USER_SUSPENDED",
            entityType: "user",
            entityId: profile.userId,
            details: { reason: activeSuspension.reason },
            ipAddress,
            userAgent,
          });

          return null;
        }

        const isValid = await compare(password, profile.user.passwordHash);
        if (!isValid) {
          await logAuditEvent({
            userId: profile.userId,
            action: "LOGIN_FAILED",
            entityType: "auth",
            entityId: profile.userId,
            details: { reason: "invalid_password", identifier },
            ipAddress,
            userAgent,
          });

          return null;
        }

        await prisma.user.update({
          where: { id: profile.userId },
          data: { lastLoginAt: new Date() },
        });

        await logAuditEvent({
          userId: profile.userId,
          action: "LOGIN_SUCCESS",
          entityType: "auth",
          entityId: profile.userId,
          details: { identifier },
          ipAddress,
          userAgent,
        });

        return {
          id: profile.userId,
          name: profile.username,
          email: profile.fakeEmail,
          image: profile.avatarUrl,
          role: profile.user.role,
          username: profile.username,
          fakeEmail: profile.fakeEmail,
        } as SessionUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as SessionUser).role;
        token.username = (user as SessionUser).username;
        token.fakeEmail = (user as SessionUser).fakeEmail;
        token.avatarUrl = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user = {
          ...session.user,
          id: token.sub,
          role: (token.role as UserRole | undefined) ?? "USER",
          username: (token.username as string | undefined) ?? session.user.name ?? "",
          fakeEmail:
            (token.fakeEmail as string | undefined) ?? session.user.email ?? "",
          image: (token.avatarUrl as string | undefined) ?? session.user.image,
        } as SessionUser;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
