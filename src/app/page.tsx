import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";

export default async function Home() {
  const sesion = await getSesion();
  redirect(sesion.usuarioId ? "/dashboard" : "/login");
}
