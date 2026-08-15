import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import FormularioLogin from "./FormularioLogin";
import FormularioAlta from "./FormularioAlta";

export default async function LoginPage() {
  const sesion = await getSesion();
  if (sesion.usuarioId) {
    redirect("/dashboard");
  }

  const supabase = supabaseServer();
  const { count } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true });

  const hayUsuario = Boolean(count && count > 0);

  return (
    <div className="pagina-centrada">
      <div className="tarjeta tarjeta-angosta">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.3rem" }}>
          {hayUsuario ? "Iniciar sesión" : "Bienvenida"}
        </h1>
        {hayUsuario ? <FormularioLogin /> : <FormularioAlta />}
      </div>
    </div>
  );
}
