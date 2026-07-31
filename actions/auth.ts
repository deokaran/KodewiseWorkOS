"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}

import { getSessionUser } from "@/lib/auth/utils";

export async function getCurrentUserAction() {
  try {
    const user = await getSessionUser();
    return { success: true as const, data: user };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to get session user" };
  }
}
