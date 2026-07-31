import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(role: "TEAM_LEADER" | "EMPLOYEE") {
  const user = await requireAuth();
  if (user.role !== role) {
    // If an EMPLOYEE tries to access TL route, redirect to employee dash
    if (user.role === "EMPLOYEE") redirect("/employee");
    // If a TL tries to access Employee route, redirect to TL dash
    if (user.role === "TEAM_LEADER") redirect("/tl");
  }
  return user;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user || null;
}
