"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function credentialsSignIn(
  _prevState: { error: string } | null,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials." };
    }
    throw error;
  }
  return null;
}

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
