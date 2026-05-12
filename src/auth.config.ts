import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    }),
    Credentials({
      // Actual validation is done in auth.ts (Node.js runtime) where bcrypt is available.
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
