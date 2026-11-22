"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  // select_account lets someone who hit "no access" pick a different Google account.
  await signIn("google", { redirectTo: "/admin" }, { prompt: "select_account" });
}

export async function signOutAdmin() {
  await signOut({ redirectTo: "/admin" });
}
