import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";

import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { verifyPassword } from "@/lib/password";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Book Club <no-reply@bookclub.local>";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // JWT sessions are required by the Credentials (email + password) provider.
  // The Drizzle adapter is still used to persist users and magic-link tokens.
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY ?? "dev-no-key",
      from: EMAIL_FROM,
      /**
       * In development (or when no Resend key is configured) we don't send a real
       * email — the magic-link URL is printed to the server console so you can sign
       * in immediately with zero external setup. In production with a real
       * RESEND_API_KEY, the default Resend delivery is used.
       */
      async sendVerificationRequest(params) {
        const { identifier, url, provider } = params;
        const hasRealKey =
          !!process.env.RESEND_API_KEY &&
          process.env.RESEND_API_KEY !== "dev-no-key";

        if (!hasRealKey) {
          console.log(
            `\n✉️  Magic sign-in link for ${identifier}:\n   ${url}\n`,
          );
          return;
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: "Your Book Club sign-in link",
            html: `<p>Click to sign in to Book Club:</p><p><a href="${url}">${url}</a></p>`,
            text: `Sign in to Book Club: ${url}`,
          }),
        });
        if (!res.ok) {
          throw new Error(`Resend error: ${JSON.stringify(await res.json())}`);
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on initial sign-in; persist its id on the token.
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
