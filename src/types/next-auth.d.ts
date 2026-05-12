import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      username: string;
      fakeEmail: string;
    };
  }

  interface User {
    role: UserRole;
    username: string;
    fakeEmail: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    username?: string;
    fakeEmail?: string;
    avatarUrl?: string | null;
  }
}
