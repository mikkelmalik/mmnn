import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Book Club <no-reply@bookclub.local>";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify",
  },
  providers: [
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
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
