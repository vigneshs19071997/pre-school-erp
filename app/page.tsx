import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";

export default async function Home() {
  const s = await readSession();
  redirect(s?.kind === "staff" ? "/admin" : s?.kind === "parent" ? "/parent" : "/login");
}
