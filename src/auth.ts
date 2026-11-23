import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { endOfEventDay } from "@/lib/signed-cookie";

// Reads AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET and AUTH_TRUST_HOST from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  providers: [Google],
  session: {
    strategy: "jwt",
    // Session ends at the end of the event day. Auth.js sets HttpOnly, SameSite=Lax and Secure (on https).
    maxAge: Math.max(60, Math.floor((endOfEventDay(Date.now()) - Date.now()) / 1000)),
  },
  callbacks: {
    // Only Google-verified emails on the allowlist may sign in. Every admin route re-checks with requireAdmin.
    signIn({ profile }) {
      return profile?.email_verified === true && isAdminEmail(profile.email);
    },
  },
  pages: { error: "/admin" },
}));
