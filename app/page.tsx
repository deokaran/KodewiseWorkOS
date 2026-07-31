import { getSessionUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "TEAM_LEADER") {
    redirect("/tl");
  } else {
    redirect("/employee");
  }
}
